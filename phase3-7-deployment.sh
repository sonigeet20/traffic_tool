#!/bin/bash
set -e

# Configuration
VPC_ID="vpc-0526c9da5a05585c5"
SG_ID="sg-08b44ed01825cbbb8"
AMI_ID="ami-02d31ec2f3b88eaab"
KEY_NAME="browser-automation-key"
SUBNET_1="subnet-055bffceee73f3522"  # us-east-1a
SUBNET_2="subnet-05a445f4f9f839e5c"  # us-east-1b
REGION="us-east-1"

echo "=========================================="
echo "Phase 4: Creating Target Group"
echo "=========================================="

aws elbv2 create-target-group \
  --name traffic-tool-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --health-check-enabled \
  --health-check-protocol HTTP \
  --health-check-path / \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --matcher HttpCode=200 \
  --target-type instance \
  --region $REGION \
  --output json > target-group-output.json

TG_ARN=$(jq -r '.TargetGroups[0].TargetGroupArn' target-group-output.json)
echo "✅ Target Group created: $TG_ARN"

# Add tags
aws elbv2 add-tags \
  --resource-arns $TG_ARN \
  --tags Key=Name,Value=traffic-tool-tg Key=Service,Value=traffic-generation \
  --region $REGION

# Enable stickiness
aws elbv2 modify-target-group-attributes \
  --target-group-arn $TG_ARN \
  --attributes \
    Key=stickiness.enabled,Value=true \
    Key=stickiness.type,Value=lb_cookie \
    Key=stickiness.lb_cookie.duration_seconds,Value=3600 \
    Key=deregistration_delay.timeout_seconds,Value=30 \
  --region $REGION

echo "✅ Target Group configured with stickiness"

echo ""
echo "=========================================="
echo "Phase 5: Creating Application Load Balancer"
echo "=========================================="

aws elbv2 create-load-balancer \
  --name traffic-tool-alb \
  --subnets $SUBNET_1 $SUBNET_2 \
  --security-groups $SG_ID \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --tags Key=Name,Value=traffic-tool-alb Key=Service,Value=traffic-generation \
  --region $REGION \
  --output json > alb-output.json

ALB_ARN=$(jq -r '.LoadBalancers[0].LoadBalancerArn' alb-output.json)
ALB_DNS=$(jq -r '.LoadBalancers[0].DNSName' alb-output.json)
echo "✅ ALB created"
echo "   ARN: $ALB_ARN"
echo "   DNS: $ALB_DNS"

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 3000 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN \
  --region $REGION \
  --output json > listener-output.json

LISTENER_ARN=$(jq -r '.Listeners[0].ListenerArn' listener-output.json)
echo "✅ Listener created on port 3000: $LISTENER_ARN"

echo ""
echo "=========================================="
echo "Phase 6: Creating Launch Template"
echo "=========================================="

# Create user data script
USER_DATA=$(cat <<'USERDATA' | base64
#!/bin/bash
set -e

# Wait for cloud-init to finish
cloud-init status --wait

# Navigate to app directory
cd /home/ubuntu/puppeteer-server

# Ensure PM2 is set to start on boot
sudo -u ubuntu bash -c "pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true"

# Start/restart server
sudo -u ubuntu bash -c "pm2 start server.js --name server 2>/dev/null || pm2 restart server"
sudo -u ubuntu bash -c "pm2 save"

# Enable PM2 resurrection
sudo systemctl enable pm2-ubuntu 2>/dev/null || true

echo "✅ Instance initialization complete"
USERDATA
)

aws ec2 create-launch-template \
  --launch-template-name traffic-tool-lt \
  --version-description "Traffic Tool Launch Template v1" \
  --launch-template-data "{
    \"ImageId\": \"$AMI_ID\",
    \"InstanceType\": \"t3.large\",
    \"KeyName\": \"$KEY_NAME\",
    \"SecurityGroupIds\": [\"$SG_ID\"],
    \"UserData\": \"$USER_DATA\",
    \"TagSpecifications\": [
      {
        \"ResourceType\": \"instance\",
        \"Tags\": [
          {\"Key\": \"Name\", \"Value\": \"traffic-tool-asg-instance\"},
          {\"Key\": \"Service\", \"Value\": \"traffic-generation\"},
          {\"Key\": \"ManagedBy\", \"Value\": \"ASG\"}
        ]
      }
    ],
    \"Monitoring\": {
      \"Enabled\": true
    }
  }" \
  --region $REGION \
  --output json > launch-template-output.json

LT_ID=$(jq -r '.LaunchTemplate.LaunchTemplateId' launch-template-output.json)
echo "✅ Launch Template created: $LT_ID"

echo ""
echo "=========================================="
echo "Phase 7: Creating Auto Scaling Group"
echo "=========================================="

aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name traffic-tool-asg \
  --launch-template LaunchTemplateId=$LT_ID,Version='$Latest' \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 2 \
  --default-cooldown 300 \
  --health-check-type ELB \
  --health-check-grace-period 300 \
  --vpc-zone-identifier "$SUBNET_1,$SUBNET_2" \
  --target-group-arns $TG_ARN \
  --tags \
    Key=Name,Value=traffic-tool-asg-instance,PropagateAtLaunch=true \
    Key=Service,Value=traffic-generation,PropagateAtLaunch=true \
  --region $REGION

echo "✅ Auto Scaling Group created: traffic-tool-asg"
echo "   Min: 2, Max: 10, Desired: 2"

echo ""
echo "=========================================="
echo "Phase 8: Setting Up Scaling Policies"
echo "=========================================="

# CPU-based scaling policy
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name traffic-tool-asg \
  --policy-name traffic-tool-scale-up \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration "{
    \"PredefinedMetricSpecification\": {
      \"PredefinedMetricType\": \"ASGAverageCPUUtilization\"
    },
    \"TargetValue\": 70.0
  }" \
  --region $REGION \
  --output json > scale-up-policy.json

echo "✅ CPU-based scaling policy (target 70%) created"

echo ""
echo "=========================================="
echo "DEPLOYMENT COMPLETE ✅"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ALB DNS: $ALB_DNS"
echo "  ALB ARN: $ALB_ARN"
echo "  Target Group ARN: $TG_ARN"
echo "  Launch Template: $LT_ID"
echo "  ASG Name: traffic-tool-asg"
echo ""
echo "Next: Wait 2-3 minutes for instances to launch and pass health checks"
echo ""

# Save configuration
cat > traffic-tool-infrastructure.env << EOF
ALB_DNS=$ALB_DNS
ALB_ARN=$ALB_ARN
TG_ARN=$TG_ARN
LT_ID=$LT_ID
VPC_ID=$VPC_ID
SG_ID=$SG_ID
AMI_ID=$AMI_ID
REGION=$REGION
EOF

echo "✅ Configuration saved to traffic-tool-infrastructure.env"

