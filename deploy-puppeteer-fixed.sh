#!/bin/bash
set -e

echo "Deploying fixed puppeteer-server.js to EC2..."

# SCP the file to EC2
scp -o StrictHostKeyChecking=no puppeteer-server.js ubuntu@13.218.100.97:~/

# Restart the server
ssh ubuntu@13.218.100.97 << 'EOF'
echo "Restarting puppeteer server..."
pm2 restart server
pm2 logs server --lines 20
EOF

echo "Deployment complete!"
echo "The server now has:"
echo "  - 60 second timeouts (instead of 300s)"
echo "  - No default resource blocking"
echo "  - Proper proxy authentication"
