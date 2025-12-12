#!/bin/bash

# AWS Deployment Script for Real-Device Mode Server
# Usage: ./deploy-to-aws.sh

set -e

AWS_USER="ubuntu"
AWS_IP="13.218.100.97"
AWS_PATH="/home/ubuntu/puppeteer-server"
LOCAL_FILE="server.cjs"

echo "════════════════════════════════════════════════════════════"
echo "🚀 DEPLOYING TO AWS"
echo "════════════════════════════════════════════════════════════"

# Check if file exists
if [ ! -f "$LOCAL_FILE" ]; then
  echo "❌ Error: $LOCAL_FILE not found in current directory"
  exit 1
fi

echo ""
echo "📋 Deployment Details:"
echo "   Local file: $LOCAL_FILE"
echo "   Remote: $AWS_USER@$AWS_IP:$AWS_PATH/"
echo "   Target: node server.cjs"
echo ""

# Step 1: Copy file
echo "Step 1️⃣  Copying server.cjs to AWS..."
scp "$LOCAL_FILE" "$AWS_USER@$AWS_IP:$AWS_PATH/" || {
  echo "❌ SCP failed - check SSH connection"
  exit 1
}
echo "✅ File copied"

# Step 2: Stop old server and install dependencies
echo ""
echo "Step 2️⃣  Stopping old server and installing dependencies..."
ssh "$AWS_USER@$AWS_IP" << 'EOFAWS'
set -e
echo "  📍 Stopping existing processes..."
pkill -f "node server" || true
pkill -f "node puppeteer" || true
sleep 2

echo "  📍 Going to directory..."
cd /home/ubuntu/puppeteer-server

echo "  📍 Installing dependencies..."
npm install --production 2>&1 | tail -5

echo "✅ Dependencies installed"
EOFAWS

# Step 3: Start new server
echo ""
echo "Step 3️⃣  Starting new server..."
ssh "$AWS_USER@$AWS_IP" << 'EOFAWS'
cd /home/ubuntu/puppeteer-server
echo "  📍 Starting server..."
nohup node server.cjs > puppeteer.log 2>&1 &
SERVERPID=$!
sleep 3

echo "  📍 Verifying server..."
if curl -s http://localhost:3000/health > /dev/null; then
  echo "✅ Server is running (PID: $SERVERPID)"
else
  echo "⚠️  Server may not be responding yet, check logs: tail -f puppeteer.log"
fi
EOFAWS

# Step 4: Verify from local machine
echo ""
echo "Step 4️⃣  Verifying from local machine..."
sleep 2

if curl -s "http://$AWS_IP:3000/health" | grep -q "ok"; then
  echo "✅ Server is responding correctly!"
  RESPONSE=$(curl -s "http://$AWS_IP:3000/health")
  echo "   Response: $RESPONSE"
else
  echo "⚠️  Could not reach server, try again in a few seconds:"
  echo "   curl http://$AWS_IP:3000/health"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "✅ Server deployed and running on http://$AWS_IP:3000"
echo ""
echo "📊 Useful commands:"
echo "   Check logs:"
echo "   ssh $AWS_USER@$AWS_IP 'tail -f /home/ubuntu/puppeteer-server/puppeteer.log'"
echo ""
echo "   Check if running:"
echo "   ssh $AWS_USER@$AWS_IP 'ps aux | grep \"node server.cjs\" | grep -v grep'"
echo ""
echo "   Restart server:"
echo "   ssh $AWS_USER@$AWS_IP 'pkill -f \"node server\" && sleep 2 && cd /home/ubuntu/puppeteer-server && nohup node server.cjs > puppeteer.log 2>&1 &'"
echo ""
