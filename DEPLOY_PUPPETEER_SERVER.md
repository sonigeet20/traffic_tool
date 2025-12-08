# Deploy Updated Puppeteer Server

## What Changed
- Improved Google search domain matching (exact match first, then partial)
- Added comprehensive logging with `[GOOGLE SEARCH]` and `[REFERRER]` tags
- Stores clicked URL in database (`google_search_clicked_url`)
- Supports custom referrer override for all traffic
- Added random browsing behavior when no journey is planned

## Deployment Steps

### 1. Copy Updated File to EC2
```bash
scp puppeteer-server.js ubuntu@13.218.100.97:~/
```

Or use any method you prefer to copy the file.

### 2. SSH into EC2
```bash
ssh ubuntu@13.218.100.97
```

### 3. Stop Current Server
```bash
# Find the process
ps aux | grep puppeteer-server

# Kill it (replace PID with actual process ID)
kill <PID>

# OR if running with pm2
pm2 stop puppeteer-server
pm2 delete puppeteer-server
```

### 4. Start New Server
```bash
# Start in background with nohup
nohup node puppeteer-server.js > puppeteer.log 2>&1 &

# OR with pm2 (recommended)
pm2 start puppeteer-server.js
pm2 save
```

### 5. Verify Server is Running
```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "features": [
    "100k+ user agents",
    "Google search flow",
    "Fingerprinting"
  ]
}
```

### 6. Check Logs
```bash
# If using nohup
tail -f puppeteer.log

# If using pm2
pm2 logs puppeteer-server
```

## Test the Deployment

### Quick Test from Command Line
```bash
curl -X POST http://localhost:3000/api/automate \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://groeixyz.com",
    "searchKeyword": "groei",
    "customReferrer": "https://www.google.com/"
  }'
```

Look for these logs:
```
[GOOGLE SEARCH] Looking for domain: groeixyz.com in search results
[GOOGLE SEARCH] Found X total links on page
[GOOGLE SEARCH] Filtered to X search result links
[GOOGLE SEARCH] ✓ EXACT MATCH FOUND: https://groeixyz.com/
[GOOGLE SEARCH] ✓ Successfully clicked search result
[REFERRER] Setting custom referrer: https://www.google.com/
```

## Next Steps

After deployment, create a test campaign:
1. Set search traffic to 100%
2. Add keyword: "groei" or another relevant keyword
3. Set custom referrer: `https://www.google.com/`
4. Run 1-2 test sessions
5. Check database with the SQL query below

## Check Results in Database

```sql
-- See what URLs were clicked
SELECT
  id,
  search_keyword,
  google_search_clicked_url,
  google_search_result_clicked,
  status,
  created_at
FROM bot_sessions
WHERE traffic_source = 'search'
ORDER BY created_at DESC
LIMIT 10;
```

Expected results:
- `google_search_clicked_url` should show actual URLs like `https://groeixyz.com/`
- OR `NOT_FOUND_IN_RESULTS` if domain wasn't ranking
- `google_search_result_clicked` should be `true`

## Troubleshooting

### Server won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -t -i:3000)
```

### Can't find domain in search results
- Try different keywords that your site actually ranks for
- Use `groeixyz.com` as keyword (direct brand search)
- Check logs to see what URLs Google is returning
- Use custom referrer override as fallback

### No logs appearing
```bash
# Make sure you're tailing the right log file
ls -la ~/puppeteer.log

# Or check pm2 logs
pm2 logs --lines 100
```
