#!/bin/bash
# Setup Xvfb for running Chrome with extensions

echo "Installing Xvfb..."
sudo apt-get update
sudo apt-get install -y xvfb

echo "Creating Xvfb startup script..."
cat > /puppeteer-server/start-with-xvfb.sh << 'EOF'
#!/bin/bash
export DISPLAY=:99
Xvfb :99 -screen 0 1920x1080x24 > /dev/null 2>&1 &
sleep 2
node /puppeteer-server/server.js
EOF

chmod +x /puppeteer-server/start-with-xvfb.sh

echo "Updating PM2 to use Xvfb..."
pm2 delete server 2>/dev/null || true
pm2 start /puppeteer-server/start-with-xvfb.sh --name server --log /puppeteer-server/logs.txt
pm2 save

echo "Done! Server restarted with Xvfb support"
pm2 status
