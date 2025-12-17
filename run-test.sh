#!/bin/bash

echo "🧪 Running Luna Headful Search Test..."
echo ""

curl -X POST http://localhost:3001/test/luna-search \
  -H "Content-Type: application/json" \
  -d '{
    "searchKeyword": "best web hosting services",
    "targetUrl": "https://www.example.com",
    "geoLocation": "US",
    "proxy": "pr.lunaproxy.com:12233",
    "proxyUsername": "user-admin_X5otK",
    "proxyPassword": "Dang7898"
  }' | jq .

echo ""
echo "✅ Test complete!"
