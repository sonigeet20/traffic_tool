# Dual-Proxy Implementation for SERP + Luna

## Overview
This implementation uses **two separate proxies** for search traffic:
1. **Bright Data SERP API** - For getting clean Google search results
2. **Luna Residential Proxy** - For visiting the clicked URL from search results

## Why Dual-Proxy?
- **Browser Automation API limitation**: When you connect to Bright Data's remote browser via WebSocket, it already has its own IP/proxy. You cannot layer Luna proxy on top.
- **SERP API advantage**: Bright Data's SERP API gives you clean, structured search results through their infrastructure.
- **Luna for site visits**: Use Luna's residential proxies for the actual target site visit, giving you geo-targeted, residential IPs.

## Flow Diagram

```
Search Traffic Flow:
┌──────────────────────┐
│  Campaign Starts     │
│  (Search Keyword)    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Step 1: SERP API                │
│  ├─ Use Bright Data SERP API     │
│  ├─ Get organic search results   │
│  └─ Extract clicked URL          │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Step 2: Luna Proxy              │
│  ├─ Close SERP connection        │
│  ├─ Launch NEW browser           │
│  ├─ Connect via Luna proxy       │
│  │   (geo-targeted residential)  │
│  └─ Visit clicked URL            │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Step 3: User Journey            │
│  ├─ Execute actions on site      │
│  ├─ Track engagement             │
│  └─ Complete session             │
└──────────────────────────────────┘

Direct Traffic Flow:
┌──────────────────────┐
│  Campaign Starts     │
│  (Direct Traffic)    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Luna Proxy Only                 │
│  ├─ Launch browser with proxy    │
│  ├─ Visit target URL directly    │
│  └─ Execute user journey         │
└──────────────────────────────────┘
```

## Implementation Details

### 1. Puppeteer Server (`puppeteer-server.js`)
- Added `searchWithBrightDataSERP()` function to call SERP API
- Modified main flow to:
  - Check if `useSerpApi` is enabled and `searchKeyword` exists
  - Call SERP API to get search results
  - Find target URL in results or pick from top 5
  - Close SERP connection
  - Launch NEW browser with Luna proxy
  - Navigate to clicked URL
  - Execute user journey with Luna proxy

### 2. Campaign Scheduler (`campaign-scheduler/index.ts`)
- Fetches SERP API credentials from `bright_data_serp_config` table
- Passes credentials to puppeteer server when:
  - `use_serp_api` is enabled
  - Traffic source is `search`
  - Search keyword exists

### 3. Frontend (`CampaignsList.tsx`)
- Updated to fetch and pass both:
  - `browser_ws_endpoint` (for Browser Automation API - not used with SERP)
  - SERP API credentials (api_token, customer_id, zone_name, endpoint, port)

## Database Fields Used

From `bright_data_serp_config` table:
- **SERP API**: `api_token`, `customer_id`, `zone_name`, `endpoint`, `port`
- **Browser Automation**: `browser_ws_endpoint` (not used in dual-proxy flow)

From `campaigns` table:
- `use_serp_api` - Enable SERP API for search
- `use_residential_proxies` - Enable Luna proxy
- `proxy_username`, `proxy_password` - Luna credentials
- `search_keywords` - Keywords for SERP search

From `bot_sessions` table:
- `clicked_url` - Stores the URL clicked from SERP results

## Configuration Requirements

### For SERP API Search:
1. Enable "Use SERP API" in campaign settings
2. Configure SERP API credentials in Settings > SERP Config:
   - API Token (password)
   - Customer ID
   - Zone Name (default: "serp")
3. Enable "Use Residential Proxies" for Luna
4. Configure Luna proxy credentials in campaign:
   - Proxy Username
   - Proxy Password

### For Direct Traffic:
1. Disable "Use SERP API"
2. Enable "Use Residential Proxies" for Luna
3. Configure Luna credentials

## Example SERP API Response Flow

1. **Search Request**: `https://www.google.com/search?q=example+keyword&gl=US`
2. **SERP API Returns**: HTML with organic results
3. **Extract URLs**: Parse `<a href="/url?q=https://example.com/page">` links
4. **Filter Results**: 
   - Remove Google/YouTube URLs
   - Find target domain or pick from top 5
5. **Luna Visit**: Navigate to extracted URL with Luna proxy

## Benefits

✅ **Clean SERP Data**: Bright Data handles Google's anti-bot measures  
✅ **Residential IPs**: Luna provides geo-targeted residential proxies  
✅ **Realistic Flow**: Mimics real user behavior (search → click → visit)  
✅ **Tracked Clicks**: `clicked_url` stored in database for analytics  
✅ **Flexible**: Works with or without SERP API (falls back to direct)

## Testing

To test the dual-proxy flow:
1. Create a campaign with search keywords
2. Enable "Use SERP API" and "Use Residential Proxies"
3. Configure both SERP and Luna credentials
4. Start campaign
5. Check logs for:
   - `[SERP API] Searching for "keyword"`
   - `[SERP API] Found X organic results`
   - `[LUNA PROXY] ✓ Authenticated with Luna proxy`
   - `[NAVIGATION] Navigating to: <clicked-url>`

## Troubleshooting

**SERP API not working?**
- Check credentials in Settings > SERP Config
- Verify zone name is "serp" (or your configured zone)
- Check Bright Data dashboard for SERP API access

**Luna proxy failing?**
- Verify proxy credentials in campaign settings
- Check country code matches `target_geo_locations`
- Ensure session parameter is included in username

**No search results?**
- SERP API will fall back to direct navigation
- Check search keyword is provided
- Verify SERP credentials are passed to puppeteer server
