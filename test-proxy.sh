#!/bin/bash

# Test Bright Data Proxy Connectivity

echo "🔍 Testing Bright Data HTTP Proxy Connectivity"
echo "=============================================="
echo ""

# Configuration
PROXY_ENDPOINT="brd.superproxy.io"
PROXY_PORT="33335"
USERNAME="brd-customer-hl_a908b07a-zone-scraping_browser1"
PASSWORD="dw6x0q7oe6ix"
PROXY_URL="http://${USERNAME}:${PASSWORD}@${PROXY_ENDPOINT}:${PROXY_PORT}"

echo "Test 1: DNS Resolution"
ping -c 1 ${PROXY_ENDPOINT} > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ ${PROXY_ENDPOINT} is reachable"
else
    echo "✗ ${PROXY_ENDPOINT} is NOT reachable"
fi
echo ""

echo "Test 2: Simple HTTP request through proxy"
curl -s -x ${PROXY_URL} \
  -A "Mozilla/5.0" \
  -w "\nHTTP Status: %{http_code}\n" \
  -o /tmp/google_test.html \
  "https://www.google.com/search?q=test&num=5" 

if [ -f /tmp/google_test.html ]; then
    SIZE=$(wc -c < /tmp/google_test.html)
    echo "Response size: ${SIZE} bytes"
    
    if grep -q "google" /tmp/google_test.html; then
        echo "✓ Valid Google response received"
    else
        echo "⚠ Response received but may not be Google"
    fi
fi
echo ""

echo "Test 3: Direct Google Search via curl"
curl -s -x ${PROXY_URL} \
  -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
  -H "Accept-Language: en-US,en;q=0.9" \
  "https://www.google.com/search?q=groeixyz.com&gl=us&num=10" \
  | head -100

echo ""
echo "=============================================="
echo "Proxy connectivity test completed"
