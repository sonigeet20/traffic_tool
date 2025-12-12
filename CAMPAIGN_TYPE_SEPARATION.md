# Campaign Type Separation Implementation

## Overview
This document describes the complete separation of Direct and Search campaigns to eliminate confusion about proxy routing and ensure clean, predictable behavior.

## Problem Statement
Previously, campaigns had mixed proxy logic where:
- Browser API was used for Google search
- Luna Proxy was used for site navigation after search
- This caused confusion when users selected "Browser API only" but still saw Luna proxy calls
- Mixed strategies made cost tracking and behavior unpredictable

## Solution
Implemented complete campaign type separation with dedicated proxy strategies:
- **Search Campaigns**: Use Bright Data Browser API exclusively (search + navigation)
- **Direct Campaigns**: Use Luna Proxy exclusively (direct navigation only)

## Changes Made

### 1. Database Migration (`supabase/migrations/20251124120000_add_campaign_type.sql`)
```sql
ALTER TABLE campaigns 
ADD COLUMN campaign_type TEXT DEFAULT 'direct' 
CHECK (campaign_type IN ('direct', 'search'));
```
- Added `campaign_type` column with values 'direct' or 'search'
- Default is 'direct' for backward compatibility
- Includes migration logic to set existing campaigns based on search_keywords

### 2. Backend Server (`server.cjs`)
#### Changed `/api/automate` endpoint routing:

**Search Campaign Flow:**
```javascript
if (campaignType === 'search') {
  // Validate: browser_api_token, browser_zone, searchKeyword required
  // Execute: searchWithBrowserAPIHTTP() → find target in results
  // Navigate: navigateWithBrowserAPIHTTP() → target site
  // Complete: No Luna proxy involved
}
```

**Direct Campaign Flow:**
```javascript
if (campaignType === 'direct') {
  // Validate: proxy, proxyUsername, proxyPassword required
  // Launch: Puppeteer with Luna proxy configuration
  // Authenticate: Set geo-targeting headers
  // Navigate: Direct to target URL
  // Complete: No Browser API involved
}
```

**Removed:**
- `shouldUseBrowserApiForAll` flag
- Mixed proxy handoff logic
- WebSocket fallback mechanisms
- All dual-proxy complexity

### 3. Frontend Campaign Form (`src/components/CampaignForm.tsx`)

#### Added Campaign Type Selector:
```tsx
<div className="grid grid-cols-2 gap-4">
  <button onClick={() => setCampaignType('search')}>
    🔍 Search Campaign
    Browser API for Google Search + Click
  </button>
  <button onClick={() => setCampaignType('direct')}>
    🎯 Direct Campaign
    Luna Proxy for Direct Navigation
  </button>
</div>
```

#### Conditional Field Rendering:
- **Search Campaigns**: Show only search keywords field
- **Direct Campaigns**: Show traffic distribution (backward compatibility)

#### State Management:
- Added `campaignType` state
- Persist to database on save
- Load from database on edit

### 4. Scheduler Updates (`supabase/functions/campaign-scheduler/index.ts`)

#### Credential Fetching Logic:
```typescript
if (campaignType === 'search') {
  // Fetch Browser API credentials from bright_data_serp_config
  // Require: browser_api_token, browser_zone
  // Stop if missing
} else {
  // Use Luna proxy credentials from campaign
  // Require: proxy_username, proxy_password, proxy_host, proxy_port
  // Stop if missing
}
```

#### Session Creation:
- Traffic source matches campaign type (no random distribution)
- Payload includes `campaignType` field
- Credentials added based on type:
  - Search: `browser_api_token`, `browser_zone`, `searchKeyword`
  - Direct: `proxy`, `proxyUsername`, `proxyPassword`

### 5. Type Definitions (`src/lib/database.types.ts`)
Added `campaign_type` to `CampaignRow`:
```typescript
campaign_type?: Nullable<'direct' | 'search'>;
```

## User Experience

### Creating a Search Campaign:
1. Select "🔍 Search Campaign" type
2. Enter target URL
3. Add search keywords (required)
4. Configure Browser API credentials in Settings → SERP Config
5. Launch campaign
6. **Result**: All traffic uses Browser API for search + navigation

### Creating a Direct Campaign:
1. Select "🎯 Direct Campaign" type
2. Enter target URL
3. Configure Luna proxy credentials
4. Launch campaign
5. **Result**: All traffic uses Luna proxy for direct navigation

## Benefits
✅ **Clear Separation**: No mixing of proxy types within campaigns
✅ **Predictable Costs**: Know exactly which service is being used
✅ **Better UX**: Clear campaign type selection upfront
✅ **Simplified Logic**: No fallback paths or dual-proxy complexity
✅ **Type Safety**: Campaign type enforced at database and UI levels

## Migration Path
- Existing campaigns default to 'direct' type
- Users can edit and change to 'search' if they want Browser API
- No breaking changes to existing functionality

## Testing Checklist
- [ ] Create new search campaign with Browser API credentials
- [ ] Verify search campaign uses Browser API exclusively
- [ ] Create new direct campaign with Luna credentials
- [ ] Verify direct campaign uses Luna proxy exclusively
- [ ] Edit existing campaign and change type
- [ ] Verify scheduler fetches correct credentials per type
- [ ] Test validation errors when credentials missing

## Files Changed
1. `supabase/migrations/20251124120000_add_campaign_type.sql` (NEW)
2. `server.cjs` - Complete rewrite of `/api/automate` endpoint
3. `src/components/CampaignForm.tsx` - Added type selector and conditional fields
4. `supabase/functions/campaign-scheduler/index.ts` - Type-based credential fetching
5. `src/lib/database.types.ts` - Added campaign_type field
