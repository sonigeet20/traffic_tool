#!/bin/bash

# Enhanced Anti-Fingerprinting Puppeteer Server Deployment
# This script deploys the upgraded puppeteer server with stealth plugins

echo "=================================================="
echo "DEPLOYING ENHANCED ANTI-FINGERPRINTING SERVER"
echo "=================================================="

# Configuration
EC2_HOST="54.176.69.64"
EC2_USER="ubuntu"
EC2_KEY="~/.ssh/groei-ec2.pem"
REMOTE_DIR="/home/ubuntu/puppeteer-server"

echo ""
echo "Step 1: Copying puppeteer-server.js to EC2..."
scp -i "$EC2_KEY" puppeteer-server.js "$EC2_USER@$EC2_HOST:$REMOTE_DIR/"

if [ $? -ne 0 ]; then
    echo "❌ Failed to copy file"
    exit 1
fi

echo "✓ File copied successfully"
echo ""
echo "Step 2: Installing stealth plugins on EC2..."

ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
cd /home/ubuntu/puppeteer-server

echo "Installing puppeteer-extra and stealth plugin..."
npm install puppeteer-extra puppeteer-extra-plugin-stealth

if [ $? -ne 0 ]; then
    echo "❌ Failed to install packages"
    exit 1
fi

echo "✓ Packages installed successfully"
echo ""
echo "Step 3: Restarting PM2 process..."

# Stop current process
pm2 stop puppeteer-server 2>/dev/null || echo "No existing process found"

# Delete old process
pm2 delete puppeteer-server 2>/dev/null || echo "Nothing to delete"

# Start new process with increased memory
pm2 start puppeteer-server.js \
    --name puppeteer-server \
    --max-memory-restart 2G \
    --time

# Save PM2 configuration
pm2 save

echo ""
echo "Step 4: Checking server status..."
sleep 2
pm2 status

echo ""
echo "Step 5: Viewing recent logs..."
pm2 logs puppeteer-server --lines 20 --nostream

ENDSSH

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "=================================================="
echo "✓ DEPLOYMENT COMPLETE!"
echo "=================================================="
echo ""
echo "ENHANCEMENTS DEPLOYED:"
echo "  ✓ puppeteer-extra with stealth plugin"
echo "  ✓ Enhanced canvas fingerprint randomization"
echo "  ✓ WebGL vendor/renderer randomization"
echo "  ✓ Audio context fingerprint noise"
echo "  ✓ Battery API randomization"
echo "  ✓ Connection type randomization"
echo "  ✓ Mouse event timing variation"
echo "  ✓ Chrome runtime object mocking"
echo "  ✓ Realistic plugins array"
echo "  ✓ Screen dimensions randomization"
echo ""
echo "Test the deployment:"
echo "  ssh -i $EC2_KEY $EC2_USER@$EC2_HOST"
echo "  pm2 logs puppeteer-server"
echo ""
