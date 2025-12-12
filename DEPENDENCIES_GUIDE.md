# DEPENDENCIES GUIDE - What to Install on AWS

## Quick Answer

**You DON'T need to manually install individual packages.**

Just run: `npm install`

That's it! NPM will read `package.json` and install everything needed.

---

## What Gets Installed (When You Run `npm install`)

### Core Browser Automation (REQUIRED)
```
puppeteer-core@24.32.1          10MB  Browser control library
puppeteer-extra@3.3.6            1MB  Plugin system for evasion
puppeteer-extra-plugin-stealth   1MB  Hides automation detection
user-agents@1.1.669              1MB  Random user agent strings
```

### Server Framework (REQUIRED)
```
express@5.2.1                    2MB  REST API framework (web server)
axios@1.13.2                     1MB  HTTP client for SERP API calls
```

### System Requirements (NOT from NPM, must be on AWS)
```
Node.js v18+        (needed to run node command)
npm v9+             (comes with Node.js)
Chrome/Chromium     (needed for browser automation)
```

---

## Installation Steps on AWS

### Option 1: Automatic (Recommended)
```bash
ssh ubuntu@13.218.100.97
cd /home/ubuntu/puppeteer-server
npm install
```

This will:
1. Read `package.json`
2. Download all packages
3. Install to `node_modules/`
4. Create `package-lock.json` (version locking)
5. Takes ~2-3 minutes first time

### Option 2: Quick Install (Production Only)
```bash
npm install --production
```

This skips dev dependencies (smaller, faster):
- Skips: TypeScript, ESLint, Vite, etc.
- Keeps: puppeteer, express, axios (what you need)
- Size: ~20MB instead of ~500MB
- Time: ~1 minute

**Recommended for AWS** ✅

---

## Verifying Installation

### Check Node.js
```bash
node --version     # Should be v18+
npm --version      # Should be v9+
```

### Check dependencies installed
```bash
cd /home/ubuntu/puppeteer-server
npm ls --depth=0   # Shows what's installed
```

Expected output:
```
puppeteer-server@1.0.0
├── puppeteer-core@24.32.1
├── puppeteer-extra@3.3.6
├── puppeteer-extra-plugin-stealth@2.11.2
├── user-agents@1.1.669
├── express@5.2.1
└── axios@1.13.2
```

### Check Node modules folder
```bash
du -sh /home/ubuntu/puppeteer-server/node_modules
# Should be ~100-200MB
```

---

## What if Node.js Isn't Installed on AWS?

If you get "command not found: node", install it:

### Ubuntu/Debian
```bash
# Update package list
sudo apt-get update

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version    # v20.x.x
npm --version     # 10.x.x
```

### Or use NVM (Node Version Manager)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

---

## What if Chromium Isn't Available?

The server needs a browser to automate. Install one:

### Option 1: Chromium (Lightweight)
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser
```

### Option 2: Google Chrome (Recommended)
```bash
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt-get update
sudo apt-get install -y google-chrome-stable
```

### Option 3: Brave Browser
```bash
sudo apt-get install -y brave-browser
```

**Any one of these is fine** - puppeteer will find and use it.

---

## Dependency Size Reference

```
Package                              Size     Purpose
─────────────────────────────────────────────────────────
puppeteer-core                       10MB     Browser control
puppeteer-extra                      1MB      Plugins
puppeteer-extra-plugin-stealth       1MB      Anti-detection
user-agents                          1MB      User agents
express                              2MB      Web framework
axios                                1MB      HTTP library
                                    ──────
Total (installed to node_modules/)   ~20MB

With dev dependencies:               ~500MB
├─ vite
├─ react
├─ typescript
├─ eslint
└─ build tools
```

For AWS, use `npm install --production` to skip dev deps.

---

## Complete AWS Installation Workflow

```bash
# 1. SSH to AWS
ssh ubuntu@13.218.100.97

# 2. Install Node.js (if not already installed)
node --version
# If not found:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install Chrome/Chromium
sudo apt-get update
sudo apt-get install -y chromium-browser

# 4. Go to server folder
cd /home/ubuntu/puppeteer-server

# 5. Copy server.cjs (from local machine in another terminal)
# scp server.cjs ubuntu@13.218.100.97:/home/ubuntu/puppeteer-server/

# 6. Install npm dependencies (production only)
npm install --production

# 7. Start server
nohup node server.cjs > puppeteer.log 2>&1 &

# 8. Verify
sleep 2
curl http://localhost:3000/health

# You should see:
# {"status":"ok","features":["Real-Device Mode","SERP API","Luna Proxy","Fingerprinting"]}
```

---

## Troubleshooting Common Issues

### Error: "Cannot find module 'express'"
**Solution:** Run `npm install` to install dependencies

### Error: "Could not find a built-in module"
**Solution:** Missing Node.js - install it (see above)

### Error: "No usable sandbox!"
**Solution:** Missing Chromium - install with `sudo apt-get install -y chromium-browser`

### Error: "listen EADDRINUSE :::3000"
**Solution:** Port 3000 in use - kill old process:
```bash
pkill -f "node server"
sleep 2
nohup node server.cjs > puppeteer.log 2>&1 &
```

### Command `npm` not found
**Solution:** Install Node.js (see above)

---

## Automated Installation Script

Save as `install-aws.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Installing dependencies on AWS..."

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "📍 Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Check Chrome
if ! command -v chromium-browser &> /dev/null && ! command -v google-chrome &> /dev/null; then
  echo "📍 Installing Chromium..."
  sudo apt-get update
  sudo apt-get install -y chromium-browser
fi

# Install npm packages
echo "📍 Installing npm packages..."
cd /home/ubuntu/puppeteer-server
npm install --production

echo "✅ Installation complete!"
echo ""
echo "Next: nohup node server.cjs > puppeteer.log 2>&1 &"
```

Usage:
```bash
chmod +x install-aws.sh
./install-aws.sh
```

---

## Summary

| What | Where | How |
|---|---|---|
| **Node.js** | AWS system | `curl ... && sudo apt-get install nodejs` |
| **NPM packages** | node_modules/ | `npm install --production` |
| **Chrome/Chromium** | AWS system | `sudo apt-get install chromium-browser` |
| **server.cjs** | /home/ubuntu/puppeteer-server/ | `scp server.cjs ubuntu@...` |

**All commands from `package.json` are already there** - you just need to run `npm install`! ✅
