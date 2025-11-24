# Deploy Updated Puppeteer Server to EC2

## Step 1: Connect to EC2
```bash
ssh -i your-key.pem ec2-user@13.218.100.97
```

## Step 2: Install user-agents package
```bash
cd ~/puppeteer-server
npm install user-agents
```

## Step 3: Update server.js
Copy the contents of `puppeteer-server.js` from this project and replace `/home/ec2-user/puppeteer-server/server.js`

Or use this one-liner:
```bash
cat > ~/puppeteer-server/server.js << 'EOF'
[paste the entire puppeteer-server.js content here]
EOF
```

## Step 4: Restart the server
```bash
# If using PM2:
pm2 restart all

# Or if running directly:
pkill -f "node server.js"
node server.js &
```

## Step 5: Verify it's working
```bash
curl http://localhost:3000/health
```

You should see:
```json
{"status":"ok","features":["100k+ user agents","Google search flow","Fingerprinting"]}
```

## Features Added
✅ 100,000+ real user agents via `user-agents` npm package
✅ Real Google search flow: search keyword → click result → visit site
✅ Advanced browser fingerprinting (canvas, WebGL, timezone, language)
✅ Random screen sizes and hardware specs
✅ Luna Proxy support with authentication
