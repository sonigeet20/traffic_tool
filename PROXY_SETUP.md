# Proxy Configuration Guide

## Current Status

The system **DOES support proxies** - both residential (Luna Proxy) and datacenter proxies.

## How Proxy Support Works

### 1. Without Proxies (Default)
- When `use_residential_proxies` is `false` or proxy credentials are empty
- Sessions run directly without any proxy
- Works perfectly for testing and basic traffic generation

### 2. With Luna Proxy (Residential Proxies)
- When `use_residential_proxies` is `true` AND valid credentials are configured
- Each session uses a Luna Proxy with:
  - Geo-targeting based on campaign's `target_geo_locations`
  - Session-sticky IPs (same IP for entire session)
  - Proper residential proxy routing

## Configuring Luna Proxy

### In the Campaign Form:

1. **Enable Residential Proxies**: Toggle ON
2. **Proxy Username**: Your Luna Proxy customer username (e.g., `your_username`)
3. **Proxy Password**: Your Luna Proxy password
4. **Proxy Host**: `pr.lunaproxy.com` (default)
5. **Proxy Port**: `12233` (default)

### Luna Proxy Format

The system automatically formats requests as:
```
Username: customer-{your_username}-cc-{geo_code}-session-{session_id}
Password: {your_password}
Host: pr.lunaproxy.com:12233
```

Where:
- `{geo_code}` = `us`, `gb`, `ca`, `au`, etc. (based on target geo)
- `{session_id}` = First 8 characters of the session UUID

## How It Works

### Edge Function (`start-campaign`)
```typescript
// Check if proxy should be used
if (useProxies && lunaProxyUsername && lunaProxyPassword &&
    lunaProxyUsername.trim() !== '' && lunaProxyPassword.trim() !== '') {

  // Format Luna Proxy username with geo-targeting
  const geoCode = getGeoCode(geoLocation); // e.g., 'us', 'gb'
  const sessionKey = sessionId.substring(0, 8);
  const lunaUsername = `customer-${lunaProxyUsername}-cc-${geoCode}-session-${sessionKey}`;

  // Add to request payload
  requestPayload.proxy = `http://${lunaProxyHost}:${lunaProxyPort}`;
  requestPayload.proxyUsername = lunaUsername;
  requestPayload.proxyPassword = lunaProxyPassword;
}
```

### Puppeteer Server
```javascript
// Only add proxy if credentials are valid
if (proxy && proxyUsername && proxyPassword &&
    proxyUsername !== "YOUR_LUNA_USERNAME" &&
    proxyPassword !== "YOUR_LUNA_PASSWORD") {

  launchOptions.args.push(`--proxy-server=${proxy}`);

  // Authenticate after browser launches
  await page.authenticate({
    username: proxyUsername,
    password: proxyPassword
  });
}
```

## Troubleshooting

### Sessions Failing with SSL Errors
This happens when:
- Proxy credentials are invalid
- Luna Proxy account has insufficient balance
- Proxy host/port is incorrect

**Solution**: The system gracefully handles this by:
1. Logging the error
2. Marking session as failed
3. Continuing with other sessions

### Testing Proxy Configuration
1. Set up a campaign with 2-3 sessions
2. Enable proxies with valid credentials
3. Start campaign
4. Check session logs for "Using Luna Proxy" messages
5. Verify sessions complete successfully

## Best Practices

1. **Test without proxies first** - Verify basic functionality works
2. **Start small** - Test with 2-3 sessions before scaling
3. **Monitor Luna Proxy balance** - Ensure sufficient credits
4. **Use geo-targeting wisely** - Match target locations to your goals
5. **Check session logs** - Monitor for proxy errors

## Current Implementation Notes

- ✅ Proxy support is **fully implemented**
- ✅ Works with Luna Proxy residential proxies
- ✅ Supports geo-targeting per session
- ✅ Gracefully falls back when proxies fail
- ✅ Session-sticky IPs (same IP for entire session)
- ✅ Proper error handling and logging

## Getting Luna Proxy Credentials

1. Sign up at [LunaProxy](https://www.lunaproxy.com/)
2. Purchase residential proxy plan
3. Get your customer username from dashboard
4. Set your proxy password
5. Use these credentials in the campaign configuration
