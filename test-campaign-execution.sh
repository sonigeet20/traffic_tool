#!/bin/bash

echo "Testing if campaign execution works..."
echo ""
echo "1. Campaign status:"
curl -s "https://pffapmqqswcmndlvkjrs.supabase.co/rest/v1/campaigns?select=id,name,status&id=eq.d4411f37-6133-4be2-bb53-3ef1edf45f83" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZmFwbXFxc3djbW5kbHZranJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODY3OTYsImV4cCI6MjA4NDU2Mjc5Nn0.oVibU3ip3oLVBK0ItBjCjQSZaa1Xi-R7ocmysuqNp2k" | jq .

echo ""
echo "2. Bot sessions count:"
SESSIONS=$(curl -s "https://pffapmqqswcmndlvkjrs.supabase.co/rest/v1/bot_sessions?select=id&campaign_id=eq.d4411f37-6133-4be2-bb53-3ef1edf45f83" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZmFwbXFxc3djbW5kbHZranJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODY3OTYsImV4cCI6MjA4NDU2Mjc5Nn0.oVibU3ip3oLVBK0ItBjCjQSZaa1Xi-R7ocmysuqNp2k")
echo "$SESSIONS" | jq 'length'

echo ""
echo "3. Testing backend connectivity:"
curl -s http://traffic-tool-alb-681297197.us-east-1.elb.amazonaws.com:3000/health | jq .

echo ""
echo "4. Triggering scheduler manually..."
curl -s -X POST "https://pffapmqqswcmndlvkjrs.supabase.co/functions/v1/campaign-scheduler" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZmFwbXFxc3djbW5kbHZranJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk4Njc5NiwiZXhwIjoyMDg0NTYyNzk2fQ.8sfPKQV8awv8tFR5fbBH0PCxrGa69x6ER-QEa-Hf7ak" \
  -H "Content-Type: application/json" | jq .

echo ""
echo "5. Checking sessions again after scheduler run:"
curl -s "https://pffapmqqswcmndlvkjrs.supabase.co/rest/v1/bot_sessions?select=id,status&campaign_id=eq.d4411f37-6133-4be2-bb53-3ef1edf45f83&order=created_at.desc&limit=5" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZmFwbXFxc3djbW5kbHZranJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODY3OTYsImV4cCI6MjA4NDU2Mjc5Nn0.oVibU3ip3oLVBK0ItBjCjQSZaa1Xi-R7ocmysuqNp2k" | jq .

echo ""
echo "=========================================="
echo "If sessions are created above, system is working!"
echo "If no sessions, check AWS backend logs for errors."
echo "=========================================="
