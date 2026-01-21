# Load Balancer & Autoscaling Plan

## Current Bottlenecks
- Single Node.js server instance running on t3.large
- Max 3 concurrent sessions limit (hard-coded: `MAX_CONCURRENT_SESSIONS = 3`)
- ~2-3 sessions/minute throughput
- Browser pool limited to 2 instances
- No horizontal scaling

## Target Architecture

### Phase 1: Multi-Instance Load Balancing (Week 1)

#### Deploy 3-5 identical server instances on AWS
```
┌─────────────────────────────────────────┐
│  Application Load Balancer (ALB)        │
│  - Public IP                            │
│  - Session affinity (sticky sessions)   │
│  - Health checks every 30s              │
└──────────┬──────────────────────────────┘
           │
    ┌──────┼──────┬──────┬──────┐
    │      │      │      │      │
  ┌─▼─┐  ┌─▼─┐  ┌─▼─┐  ┌─▼─┐  ┌─▼─┐
  │EC2│  │EC2│  │EC2│  │EC2│  │EC2│
  │i3 │  │i3 │  │i3 │  │i3 │  │i3 │
  │lg │  │lg │  │lg │  │lg │  │lg │
  └───┘  └───┘  └───┘  └───┘  └───┘
   
   Each instance:
   - Node.js server.cjs
   - MAX_CONCURRENT_SESSIONS = 5 (raised from 3)
   - Browser pool = 3 instances
   - Zombie cleanup every 30s
   - Resource guards active
```

#### Implementation Steps

1. **Prepare Docker Image**
   ```dockerfile
   FROM node:20-slim
   
   # Install Xvfb, Chrome, dependencies
   RUN apt-get update && apt-get install -y \
       xvfb \
       chromium-browser \
       fonts-noto \
       fonts-noto-cjk \
       && rm -rf /var/lib/apt/lists/*
   
   WORKDIR /app
   COPY server.cjs package.json package-lock.json ./
   RUN npm ci --omit=dev
   
   EXPOSE 3000
   
   # Start Xvfb + server
   CMD ["bash", "-c", "Xvfb :99 -screen 0 1920x1080x24 &>/dev/null & DISPLAY=:99 node server.cjs"]
   ```

2. **Push to AWS ECR**
   ```bash
   aws ecr create-repository --repository-name traffic-tool
   docker build -t traffic-tool:latest .
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
   docker tag traffic-tool:latest $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/traffic-tool:latest
   docker push $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/traffic-tool:latest
   ```

3. **Create ALB**
   - **Target Group**: `traffic-tool-tg`
     - Protocol: HTTP
     - Port: 3000
     - Health Check Path: `/health` (create endpoint)
     - Healthy Threshold: 2
     - Unhealthy Threshold: 3
     - Timeout: 5s
     - Interval: 30s
     - Stickiness: Enabled (1 day)
   
   - **Load Balancer**
     - Name: `traffic-tool-alb`
     - Public subnet (us-east-1a, us-east-1b)
     - Security group: Allow 80/443 inbound, 3000 to EC2

4. **Launch EC2 Instances** (via Auto Scaling)
   - Instance Type: `t3.xlarge` (instead of t3.large for headroom)
   - AMI: Ubuntu 22.04 LTS + Docker pre-installed
   - Storage: 50GB gp3
   - IAM Role: Allow CloudWatch, S3, Supabase API calls
   - Launch 3 instances initially

5. **Add `/health` Endpoint**
   ```javascript
   app.get('/health', (req, res) => {
     const uptime = process.uptime();
     const memory = process.memoryUsage();
     res.json({
       status: 'ok',
       uptime,
       memory: {
         heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + ' MB',
         heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + ' MB'
       },
       activeSessions: activeSessionCount,
       maxSessions: MAX_CONCURRENT_SESSIONS
     });
   });
   ```

---

### Phase 2: Auto Scaling (Week 2)

#### Setup Auto Scaling Group
```
Launch Template:
├── Instance Type: t3.xlarge
├── AMI: traffic-tool:latest (ECR image)
├── IAM Instance Profile: traffic-tool-role
├── User Data: 
│   #!/bin/bash
│   docker pull $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/traffic-tool:latest
│   docker run -d -p 3000:3000 --name server $IMAGE_URI
└── Min: 2, Desired: 3, Max: 10

Scale-Out Policy (Add Instances):
├── Metric: ALB Request Count Per Target
├── Threshold: > 150 requests/min per instance
├── Action: Add 2 instances
└── Cooldown: 2 minutes

Scale-In Policy (Remove Instances):
├── Metric: CPU Utilization
├── Threshold: < 20% for 5 minutes
├── Action: Remove 1 instance (min stay 2 instances)
└── Cooldown: 5 minutes
```

#### Implementation
```bash
# Create launch template
aws ec2 create-launch-template \
  --launch-template-name traffic-tool-template \
  --launch-template-data '{
    "ImageId": "ami-xxxxx",
    "InstanceType": "t3.xlarge",
    "IamInstanceProfile": {"Name": "traffic-tool-role"},
    "TagSpecifications": [{
      "ResourceType": "instance",
      "Tags": [{"Key": "Name", "Value": "traffic-tool"}]
    }]
  }'

# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name traffic-tool-asg \
  --launch-template LaunchTemplateName=traffic-tool-template,Version='$Latest' \
  --target-group-arns arn:aws:elasticloadbalancing:... \
  --min-size 2 \
  --desired-capacity 3 \
  --max-size 10 \
  --vpc-zone-identifier subnet-xxxxx,subnet-yyyyy

# Scale-out policy
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name traffic-tool-asg \
  --policy-name scale-out \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{
    "TargetValue": 150.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ALBRequestCountPerTarget"
    }
  }'
```

---

### Phase 3: Session Persistence & Distributed State (Week 3)

#### Problem: Job Queue is in-memory
Currently: `const JOBS = new Map()`
- Jobs lost on restart
- No cross-instance visibility
- Cannot check job status if different instance handles it

#### Solution: Redis-backed job queue

1. **Add Redis Cluster**
   ```
   AWS ElastiCache Redis (Multi-AZ):
   ├── Node Type: cache.t3.medium
   ├── Engine: 7.0
   ├── Parameter Group: maxmemory-policy = allkeys-lru
   ├── Replication: 2 primary + 2 replicas (HA)
   ├── Auto Failover: Enabled
   └── Encryption: TLS + at-rest
   ```

2. **Update server.cjs to use Redis**
   ```javascript
   import redis from 'redis';
   const redisClient = redis.createClient({
     host: process.env.REDIS_ENDPOINT,
     port: 6379,
     password: process.env.REDIS_PASSWORD,
     tls: true
   });
   
   // Replace in-memory JOBS Map
   // OLD: const JOBS = new Map();
   // NEW: Use redisClient
   
   // Store job result
   await redisClient.set(`job:${jobId}:status`, 'completed', {
     EX: 86400 // 24 hour TTL
   });
   await redisClient.set(`job:${jobId}:result`, JSON.stringify(result), {
     EX: 86400
   });
   
   // Retrieve job result (works across instances!)
   const result = await redisClient.get(`job:${jobId}:result`);
   ```

3. **Update Frontend Polling**
   ```javascript
   // Already polls GET /api/jobs/:jobId
   // Now it works across any instance!
   // Instance 1 starts job
   // Instance 2 can serve job status
   // Instance 3 can return result
   ```

---

### Phase 4: Monitoring & Alerting (Week 4)

#### CloudWatch Dashboards
```
Traffic Tool - Operations Dashboard:

┌─────────────────────────────────────────────┐
│ Active Sessions (across all instances)     │ gauge
│ ████░░░░░░░░░░ 45/150 sessions             │
├─────────────────────────────────────────────┤
│ Request Rate                                │ line chart
│ 200 req/min (peak) → 145 req/min (now)     │
├─────────────────────────────────────────────┤
│ Bandwidth per Session (avg)                │ line chart
│ 285 KB (current) ← TARGET: < 300 KB        │
├─────────────────────────────────────────────┤
│ Instance Health                             │
│ Instance 1 (i3.large) - CPU: 35% MEM: 62% │ GREEN
│ Instance 2 (i3.large) - CPU: 28% MEM: 48% │ GREEN
│ Instance 3 (i3.large) - CPU: 22% MEM: 41% │ GREEN
├─────────────────────────────────────────────┤
│ Job Queue Depth (Redis)                    │
│ ████░░░░░░░░░░ 12 queued, 45 processing  │
├─────────────────────────────────────────────┤
│ Errors (last hour)                          │
│ Navigation timeout: 2                       │
│ Proxy auth failed: 1                        │
│ GA not tracking: 0 ✓                        │
└─────────────────────────────────────────────┘
```

#### CloudWatch Alarms
```
1. High Concurrency Alert
   Metric: activeSessions > 140 (out of 150)
   Action: SNS → ops-team, Auto-scale +1 instance

2. High CPU Alert
   Metric: CPU > 80% for 2 min (any instance)
   Action: PagerDuty, investigate process

3. Bandwidth Overage Alert
   Metric: Bandwidth per session > 350 KB
   Action: SNS → dev-team, check resource guards

4. Job Queue Backing Up
   Metric: Redis queue size > 500
   Action: Slack notification, check for bottleneck

5. Instance Unhealthy
   Metric: /health endpoint fails
   Action: Auto-terminate + replace via ASG
```

---

### Phase 5: Cost Optimization (Week 5)

#### Reserved Instances
```
Buy 2 t3.xlarge Reserved Instances (1-year):
- Current: ~$0.1664/hour per instance
- Reserved (1yr): ~$0.088/hour per instance
- Savings: 47% on 2 baseline instances
- Flexible for +1-2 on-demand for spikes
```

#### Spot Instances for Non-Critical Work
```
Auto Scaling Group (Advanced):
├── 2 On-Demand instances (baseline, reserved)
├── 1-8 Spot instances (for bursting)
└── Cost savings: 70-80% on burst capacity
```

#### S3 for Session Logs
```
- Move old job results to S3 (after 24h)
- Compress: gzip reduce by 70%
- Lifecycle: Delete after 30 days
- Cost: ~$0.02/GB stored
```

---

## Performance Targets (Post-Scaling)

| Metric | Current | After Scaling |
|--------|---------|----------------|
| Max Concurrent Sessions | 3 | 150 (5 per instance × 30 instances) |
| Throughput | 3-5 sess/min | 60-80 sess/min |
| Latency (p95) | 8s | 5s |
| Availability | 99.0% | 99.9% |
| Bandwidth/Session | ~11 MB (before) → 300 KB | < 300 KB ✓ |
| Cost/Session | ~$0.05 | ~$0.02 |

---

## Implementation Checklist

- [ ] Phase 1: Create Docker image, ECR repo
- [ ] Phase 1: Deploy ALB + 3 EC2 instances
- [ ] Phase 1: Add `/health` endpoint
- [ ] Phase 2: Create Auto Scaling Group
- [ ] Phase 2: Configure scale-out/in policies
- [ ] Phase 3: Add Redis cluster
- [ ] Phase 3: Update server.cjs for Redis job queue
- [ ] Phase 4: Setup CloudWatch dashboards
- [ ] Phase 4: Create CloudWatch alarms
- [ ] Phase 5: Purchase reserved instances
- [ ] Load testing (100 concurrent sessions)
- [ ] Disaster recovery drill

---

## Rollback Plan

If issues arise:
1. **ALB failover to single instance**: Remove 4 instances, keep 1
2. **In-memory job queue**: Revert Redis code, restart instances
3. **Deployment issue**: Previous Docker image version (tag: `production-v1.2.3`)

---

## Next Steps

1. **This week**: Finalize Docker image, test locally
2. **Next week**: Deploy Phase 1 (ALB + 3 instances)
3. **Week 3**: Add Redis + distributed queue
4. **Week 4**: Full monitoring + alerting
5. **Week 5**: Performance testing + cost optimization
