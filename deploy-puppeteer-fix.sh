#!/bin/bash

echo "Deploying Puppeteer timeout fixes to remote server..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Uploading fixed puppeteer-server.js${NC}"
scp puppeteer-server.js ubuntu@13.218.100.97:~/puppeteer-server/server.js

if [ $? -ne 0 ]; then
    echo "Failed to upload file. Make sure you have SSH access."
    exit 1
fi

echo -e "${GREEN}✓ File uploaded successfully${NC}"

echo -e "${YELLOW}Step 2: Restarting PM2 server${NC}"
ssh ubuntu@13.218.100.97 << 'ENDSSH'
    cd ~/puppeteer-server
    pm2 restart server
    echo "Waiting for server to restart..."
    sleep 3
    pm2 status
ENDSSH

echo -e "${GREEN}✓ Server restarted${NC}"

echo -e "${YELLOW}Step 3: Monitoring logs for 30 seconds${NC}"
ssh ubuntu@13.218.100.97 "pm2 logs server --lines 20 & sleep 30; pkill -P \$\$"

echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""
echo "Changes made:"
echo "  - Browser launch timeout: 120s → 300s"
echo "  - Navigation timeouts: 120s → 300s"
echo "  - Selector timeout: 30s → 60s"
echo ""
echo "Sessions should now complete properly with random durations!"
