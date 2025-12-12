# QUICK AWS SETUP - COPY/PASTE COMMANDS

## Prerequisites (Run Once on Local Machine)
```bash
# Make sure server.cjs exists locally
ls -lh server.cjs

# Copy server.cjs to AWS
scp server.cjs ubuntu@13.218.100.97:/home/ubuntu/puppeteer-server/
```

---

## AWS Commands (Copy/Paste These in SSH Order)

### 1️⃣ SSH into AWS
```bash
ssh ubuntu@13.218.100.97
```

### 2️⃣ Check Node.js (skip step 3 if v18+)
```bash
node --version
```

### 3️⃣ Install Node.js (if needed)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs && node --version
```

### 4️⃣ Install Chromium (if needed)
```bash
chromium-browser --version || (sudo apt-get update && sudo apt-get install -y chromium-browser && chromium-browser --version)
```

### 5️⃣ Go to server folder
```bash
cd /home/ubuntu/puppeteer-server && pwd
```

### 6️⃣ Stop old server
```bash
pkill -f "node server" 2>/dev/null; sleep 2; ps aux | grep node
```

### 7️⃣ Install dependencies
```bash
npm install --production
```

### 8️⃣ Verify installation
```bash
npm ls --depth=0
```

### 9️⃣ Start new server
```bash
nohup node server.cjs > puppeteer.log 2>&1 & sleep 2 && ps aux | grep "node server"
```

### 🔟 Test health endpoint
```bash
curl http://localhost:3000/health
```

### 1️⃣1️⃣ View logs
```bash
tail -20 puppeteer.log
```

### 1️⃣2️⃣ Monitor logs (real-time, press Ctrl+C to stop)
```bash
tail -f puppeteer.log
```

---

## Testing from Local Machine

```bash
# Test from your local computer (new terminal, not SSH):
curl http://13.218.100.97:3000/health

# Should return:
# {"status":"ok","features":["Real-Device Mode","SERP API","Luna Proxy","Fingerprinting"]}
```

---

## Troubleshooting

### Port 3000 not responding?
```bash
# Check if server is running
ps aux | grep "node server"

# Check if port is listening
netstat -tulpn | grep 3000

# Kill and restart
pkill -f "node server"
sleep 2
nohup node server.cjs > puppeteer.log 2>&1 &
```

### Dependencies not installed?
```bash
# Reinstall
rm -rf node_modules package-lock.json
npm install --production
```

### Chrome/Chromium not found?
```bash
# Install Chromium
sudo apt-get update
sudo apt-get install -y chromium-browser
```

### Node.js not found?
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## Quick Status Check

```bash
echo "=== Node.js ===" && node --version && \
echo "=== NPM ===" && npm --version && \
echo "=== Chrome ===" && chromium-browser --version && \
echo "=== Server Process ===" && ps aux | grep "node server" | grep -v grep && \
echo "=== Health Check ===" && curl -s http://localhost:3000/health
```

---

## One-Liner Full Setup (After SSH)

```bash
cd /home/ubuntu/puppeteer-server && \
pkill -f "node server" 2>/dev/null; sleep 1; \
npm install --production && \
nohup node server.cjs > puppeteer.log 2>&1 & \
sleep 2 && \
curl http://localhost:3000/health
```
