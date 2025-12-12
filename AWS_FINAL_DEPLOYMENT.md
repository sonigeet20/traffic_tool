# AWS DEPLOYMENT - Using server.js Only

## Step-by-Step Commands

### STEP 1: Copy server.js to AWS (From Local Machine)
```bash
scp puppeteer-server.js ubuntu@13.218.100.97:/home/ubuntu/puppeteer-server/server.js
```

---

### STEP 2: SSH into AWS
```bash
ssh ubuntu@13.218.100.97
```

---

### STEP 3: Update System (In SSH)
```bash
sudo apt-get update
```

---

### STEP 4: Install Node.js (if not installed)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

---

### STEP 5: Install Chromium (if not installed)
```bash
sudo apt-get install -y chromium-browser
chromium-browser --version
```

---

### STEP 6: Navigate to Server Folder
```bash
cd /home/ubuntu/puppeteer-server
pwd
```

---

### STEP 7: Install Dependencies One by One
```bash
npm install puppeteer-core@24.32.1 --save
```

```bash
npm install puppeteer-extra@3.3.6 --save
```

```bash
npm install puppeteer-extra-plugin-stealth@2.11.2 --save
```

```bash
npm install user-agents@1.1.669 --save
```

```bash
npm install express@5.2.1 --save
```

```bash
npm install axios@1.13.2 --save
```

---

### STEP 8: Verify Dependencies
```bash
npm ls --depth=0
```

Should show all 6 packages installed.

---

### STEP 9: Stop Old Server (if running)
```bash
pkill -f "node server"
sleep 2
```

---

### STEP 10: Start Server
```bash
nohup node server.js > puppeteer.log 2>&1 &
sleep 2
```

---

### STEP 11: Verify Server is Running
```bash
ps aux | grep "node server" | grep -v grep
```

Should show the process running.

---

### STEP 12: Test Health Endpoint (In SSH)
```bash
curl http://localhost:3000/health
```

Should return:
```json
{"status":"ok","features":["Real-Device Mode","SERP API","Luna Proxy","Fingerprinting"]}
```

---

### STEP 13: Check Logs
```bash
tail -20 puppeteer.log
```

Should show startup messages.

---

### STEP 14: Test from Local Machine (New Terminal, Not SSH)
```bash
curl http://13.218.100.97:3000/health
```

Should return the same JSON response.

---

## Quick Copy/Paste (All commands in order)

```bash
# 1. LOCAL: Copy file
scp puppeteer-server.js ubuntu@13.218.100.97:/home/ubuntu/puppeteer-server/server.js

# 2. LOCAL: SSH into AWS
ssh ubuntu@13.218.100.97

# 3. AWS: System setup
sudo apt-get update
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y chromium-browser

# 4. AWS: Navigate
cd /home/ubuntu/puppeteer-server

# 5. AWS: Install dependencies
npm install puppeteer-core@24.32.1 --save
npm install puppeteer-extra@3.3.6 --save
npm install puppeteer-extra-plugin-stealth@2.11.2 --save
npm install user-agents@1.1.669 --save
npm install express@5.2.1 --save
npm install axios@1.13.2 --save

# 6. AWS: Verify
npm ls --depth=0

# 7. AWS: Stop and start
pkill -f "node server"
sleep 2
nohup node server.js > puppeteer.log 2>&1 &
sleep 2

# 8. AWS: Test
ps aux | grep "node server" | grep -v grep
curl http://localhost:3000/health
tail -20 puppeteer.log

# 9. LOCAL: Test from outside
# (Open new terminal, don't close SSH)
curl http://13.218.100.97:3000/health
```

---

## Files on AWS After Deployment

```
/home/ubuntu/puppeteer-server/
├── server.js                    ← Your main server (copied)
├── package.json                 ← Dependencies list
├── package-lock.json            ← Dependency lock file
├── node_modules/                ← Installed packages
├── cookies/                     ← Auto-created for cookie storage
└── puppeteer.log                ← Server logs
```

---

## That's It! 🚀

You now have:
- ✅ One server.js file running
- ✅ All 6 dependencies installed
- ✅ Real-device mode with fingerprinting
- ✅ SERP + Luna proxy integration
- ✅ Server responding on port 3000

No need for .cjs files, no duplicates, just clean server.js deployment!
