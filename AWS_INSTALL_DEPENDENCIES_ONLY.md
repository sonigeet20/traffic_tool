# AWS DEPENDENCIES - INSTALL COMMANDS (One by One)

## Prerequisites: SSH into AWS
```bash
ssh ubuntu@13.218.100.97
```

---

## STEP 1: Update System Packages
```bash
sudo apt-get update
```

---

## STEP 2: Install Node.js v20 LTS (if not already installed)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

```bash
sudo apt-get install -y nodejs
```

Verify:
```bash
node --version
```
Should show: v20.x.x

---

## STEP 3: Install Chromium Browser
```bash
sudo apt-get install -y chromium-browser
```

Verify:
```bash
chromium-browser --version
```

---

## STEP 4: Navigate to Server Folder
```bash
cd /home/ubuntu/puppeteer-server
```

Verify you're in right place:
```bash
pwd
```
Should show: /home/ubuntu/puppeteer-server

---

## STEP 5: Install NPM Dependencies (One by One)

### 5a. puppeteer-core (Browser control library)
```bash
npm install puppeteer-core@24.32.1 --save
```

### 5b. puppeteer-extra (Plugin system)
```bash
npm install puppeteer-extra@3.3.6 --save
```

### 5c. puppeteer-extra-plugin-stealth (Anti-detection)
```bash
npm install puppeteer-extra-plugin-stealth@2.11.2 --save
```

### 5d. user-agents (Random user agent generator)
```bash
npm install user-agents@1.1.669 --save
```

### 5e. express (Web server framework)
```bash
npm install express@5.2.1 --save
```

### 5f. axios (HTTP client for SERP API)
```bash
npm install axios@1.13.2 --save
```

---

## STEP 6: Verify All Dependencies Installed
```bash
npm ls --depth=0
```

Should show all 6 packages:
```
├── puppeteer-core@24.32.1
├── puppeteer-extra@3.3.6
├── puppeteer-extra-plugin-stealth@2.11.2
├── user-agents@1.1.669
├── express@5.2.1
└── axios@1.13.2
```

---

## STEP 7: Check node_modules Size
```bash
du -sh node_modules
```
Should be ~100-200MB

---

## STEP 8: Create server.cjs Using Nano
```bash
nano server.cjs
```

Then:
1. Paste your code
2. Press Ctrl+X
3. Press Y
4. Press Enter

---

## STEP 9: Stop Old Server (if running)
```bash
pkill -f "node server"
```

Wait 2 seconds:
```bash
sleep 2
```

---

## STEP 10: Start New Server
```bash
nohup node server.cjs > puppeteer.log 2>&1 &
```

Wait 2 seconds:
```bash
sleep 2
```

---

## STEP 11: Verify Server is Running
```bash
ps aux | grep "node server"
```

Should see the process listed

---

## STEP 12: Test Health Endpoint
```bash
curl http://localhost:3000/health
```

Should return:
```json
{"status":"ok","features":["Real-Device Mode","SERP API","Luna Proxy","Fingerprinting"]}
```

---

## STEP 13: Check Server Logs
```bash
tail -20 puppeteer.log
```

Should show startup messages

---

## STEP 14: Monitor Logs (Real-time)
```bash
tail -f puppeteer.log
```

Press Ctrl+C to stop

---

## Quick Reference - Copy/Paste Commands

```bash
# System setup
sudo apt-get update
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y chromium-browser

# Navigate to folder
cd /home/ubuntu/puppeteer-server

# Install dependencies individually
npm install puppeteer-core@24.32.1 --save
npm install puppeteer-extra@3.3.6 --save
npm install puppeteer-extra-plugin-stealth@2.11.2 --save
npm install user-agents@1.1.669 --save
npm install express@5.2.1 --save
npm install axios@1.13.2 --save

# Verify
npm ls --depth=0

# Create file with nano
nano server.cjs

# Stop old server
pkill -f "node server"
sleep 2

# Start new server
nohup node server.cjs > puppeteer.log 2>&1 &
sleep 2

# Test
ps aux | grep "node server"
curl http://localhost:3000/health
tail -20 puppeteer.log
```

---

## Troubleshooting Commands

**Check if Node.js installed:**
```bash
node --version
which node
```

**Check if npm works:**
```bash
npm --version
```

**Check if Chrome installed:**
```bash
chromium-browser --version
which chromium-browser
```

**Kill all node processes:**
```bash
pkill -9 node
```

**View full logs:**
```bash
cat puppeteer.log
```

**Check system resources:**
```bash
free -h
df -h
```

**Check port 3000 in use:**
```bash
netstat -tulpn | grep 3000
lsof -i :3000
```

**Restart everything:**
```bash
cd /home/ubuntu/puppeteer-server
pkill -f "node server"
sleep 2
rm -rf node_modules package-lock.json
npm install puppeteer-core@24.32.1 --save
npm install puppeteer-extra@3.3.6 --save
npm install puppeteer-extra-plugin-stealth@2.11.2 --save
npm install user-agents@1.1.669 --save
npm install express@5.2.1 --save
npm install axios@1.13.2 --save
nohup node server.cjs > puppeteer.log 2>&1 &
sleep 2
curl http://localhost:3000/health
```
