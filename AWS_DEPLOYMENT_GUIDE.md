# AWS DEPLOYMENT GUIDE - Server.cjs

## Your AWS Structure
```
/home/ubuntu/puppeteer-server/
├── server.cjs              ← Your main server file (RENAME from puppeteer-server.cjs)
├── package.json            ← Dependencies file (ALREADY EXISTS)
├── node_modules/           ← Installed packages
├── cookies/                ← Cookie persistence (auto-created)
└── puppeteer.log           ← Server logs
```

## Quick Deployment (3 Steps)

### Step 1: Copy server.cjs to AWS
```bash
# From your local machine
scp server.cjs ubuntu@13.218.100.97:/home/ubuntu/puppeteer-server/
```

### Step 2: SSH to AWS and install dependencies
```bash
ssh ubuntu@13.218.100.97

# Go to folder
cd /home/ubuntu/puppeteer-server

# Kill old process
pkill -f "node server" || true
pkill -f "node puppeteer" || true

# Wait a moment
sleep 2

# Install/update dependencies
npm install

# Start new server
nohup node server.cjs > puppeteer.log 2>&1 &

# Verify it's running
sleep 2
curl http://localhost:3000/health
```

### Step 3: Verify from local machine
```bash
# Test health endpoint
curl http://13.218.100.97:3000/health

# You should see:
# {"status":"ok","features":["Real-Device Mode","SERP API","Luna Proxy","Fingerprinting"]}
```

---

## Dependencies to Install on AWS

Your `package.json` **ALREADY HAS** all required dependencies. When you run `npm install` on AWS, it will install:

### Core Puppeteer Dependencies
```json
"puppeteer-core": "^24.32.1"           // Browser control (no Chrome bundled)
"puppeteer-extra": "^3.3.6"            // Stealth + extra features
"puppeteer-extra-plugin-stealth": "^2.11.2"  // Evade bot detection
"user-agents": "^1.1.669"              // Random user agent generation
```

### Server Dependencies
```json
"express": "^5.2.1"                    // REST API framework
"axios": "^1.13.2"                     // HTTP requests (for SERP API)
```

### Already Installed
- `node` (system package - should already be on AWS)
- `npm` (comes with Node.js)

---

## What Each Dependency Does

| Package | Why You Need It | Size |
|---------|---|---|
| `puppeteer-core` | Controls headless Chrome browser | ~10MB |
| `puppeteer-extra` | Plugin system for evasion | ~1MB |
| `puppeteer-extra-plugin-stealth` | Hides automation markers | ~1MB |
| `user-agents` | Random user agent strings | ~1MB |
| `express` | Creates REST API server | ~2MB |
| `axios` | Makes HTTP requests to SERP API | ~1MB |

**Total size**: ~15-20MB (after compression)

---

## Installation Details

### On AWS, when you run `npm install`:

1. **Reads** `package.json`
2. **Downloads** all dependencies to `node_modules/`
3. **Installs** them (mostly copies files)
4. Takes about **2-3 minutes** first time
5. On subsequent updates, only new/changed packages are downloaded

### File created:
- `package-lock.json` - Locks exact versions (already committed in your repo)

---

## Troubleshooting AWS Deployment

### If `npm install` fails:

**Missing Node.js:**
```bash
# Check if Node is installed
node --version

# If not installed (Ubuntu):
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Missing dependencies:**
```bash
# Force clean install
rm -rf node_modules package-lock.json
npm install --verbose
```

**Chrome/Chromium missing:**
The server needs Chrome/Chromium to run. It usually comes with:
```bash
# Install headless Chrome
sudo apt-get install -y chromium-browser

# Or Brave:
sudo apt-get install -y brave-browser

# Or Google Chrome:
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo apt-get install -y google-chrome-stable
```

**Port 3000 already in use:**
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill it
sudo kill -9 <PID>
```

---

## File Renaming Summary

### On Your Local Machine
- Keep: `puppeteer-server.cjs` (backup, reference)
- Keep: `server.cjs` (for AWS deployment)

### On AWS `/home/ubuntu/puppeteer-server/`
- **Use:** `server.cjs` (matches your existing folder structure)
- **NOT** `puppeteer-server.cjs` (would be inconsistent with your structure)

---

## Deployment Script (Save as `deploy.sh`)

If you want to automate deployment, create this script locally:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Real-Device Mode to AWS..."

# Step 1: Copy server file
echo "📄 Copying server.cjs to AWS..."
scp server.cjs ubuntu@13.218.100.97:/home/ubuntu/puppeteer-server/

# Step 2: Deploy and restart
echo "🔄 Restarting server on AWS..."
ssh ubuntu@13.218.100.97 << 'EOF'
cd /home/ubuntu/puppeteer-server
pkill -f "node server" || true
pkill -f "node puppeteer" || true
sleep 2
npm install --production
nohup node server.cjs > puppeteer.log 2>&1 &
sleep 2
curl http://localhost:3000/health
EOF

# Step 3: Verify
echo "✅ Verifying deployment..."
curl -s http://13.218.100.97:3000/health | jq .

echo "🎉 Deployment complete!"
```

**To use it:**
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Next Steps

1. **Copy file to AWS:**
   ```bash
   scp server.cjs ubuntu@13.218.100.97:/home/ubuntu/puppeteer-server/
   ```

2. **SSH and install:**
   ```bash
   ssh ubuntu@13.218.100.97
   cd /home/ubuntu/puppeteer-server
   npm install
   ```

3. **Start server:**
   ```bash
   nohup node server.cjs > puppeteer.log 2>&1 &
   ```

4. **Verify:**
   ```bash
   curl http://localhost:3000/health
   ```

5. **Test from local:**
   ```bash
   curl http://13.218.100.97:3000/health
   ```

---

## Monitoring on AWS

**Check if server is running:**
```bash
ssh ubuntu@13.218.100.97 "ps aux | grep 'node server.cjs' | grep -v grep"
```

**View logs:**
```bash
ssh ubuntu@13.218.100.97 "tail -f /home/ubuntu/puppeteer-server/puppeteer.log"
```

**Restart server:**
```bash
ssh ubuntu@13.218.100.97 "pkill -f 'node server' && sleep 2 && cd /home/ubuntu/puppeteer-server && nohup node server.cjs > puppeteer.log 2>&1 &"
```

---

## Summary

✅ **File name:** `server.cjs` (not puppeteer-server.cjs)
✅ **Location:** `/home/ubuntu/puppeteer-server/server.cjs`
✅ **Dependencies:** All in `package.json` - just run `npm install`
✅ **Command:** `node server.cjs`
✅ **Port:** 3000

You're ready to deploy! 🚀
