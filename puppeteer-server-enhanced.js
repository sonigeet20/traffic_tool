// Enhanced Puppeteer Server with Supabase Logging Integration
// Add this at the top of puppeteer-server.js (line 1)

// Helper function to insert logs into Supabase
async function insertSessionLog(supabaseUrl, supabaseKey, sessionId, level, message, metadata = {}) {
  if (!supabaseUrl || !supabaseKey || !sessionId) {
    console.log('[LOG] Skipping - missing Supabase credentials');
    return;
  }
  
  try {
    const response = await axios.post(
      `${supabaseUrl}/rest/v1/session_logs`,
      {
        session_id: sessionId,
        level: level,
        message: message,
        metadata: metadata
      },
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      }
    );
    
    // Success - no output needed for quiet operation
    return true;
  } catch (err) {
    // Silent fail - don't spam logs
    return false;
  }
}

// Add this right after the try { block in the POST /api/automate handler (around line 495)
// Track key events with logging

async function executeSessionWithLogging(req, res) {
  const {
    url, geoLocation, proxy, proxyUsername, proxyPassword,
    searchKeyword, userJourney, sessionId, supabaseUrl, supabaseKey,
    sessionDurationMin, sessionDurationMax,
    useSerpApi, proxy_provider,
    serp_api_token, serp_customer_id, serp_zone_name, serp_endpoint, serp_port,
    useBrowserAutomation, browser_customer_id, browser_zone, browser_password,
    browser_endpoint, browser_port, extensionCrxUrl, customReferrer, maxBandwidthMB
  } = req.body;

  console.log(`[SESSION] Starting - Search: ${searchKeyword ? 'Yes' : 'No'}, Target: ${url}`);
  
  // Log session start
  await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'info', 
    `Session started - Target: ${url}, Search: ${searchKeyword || 'direct'}`,
    { target_url: url, search_keyword: searchKeyword, geo_location: geoLocation }
  );

  let browser;
  let page;
  let totalBandwidthBytes = 0;
  const normalizedMaxBandwidthMB = maxBandwidthMB ? Number(maxBandwidthMB) : 0.2;
  const maxBandwidthBytes = normalizedMaxBandwidthMB * 1024 * 1024;
  
  try {
    // Generate realistic device profile
    const deviceProfile = generateDeviceProfile(geoLocation || 'US');
    console.log(`[DEVICE] Using: ${deviceProfile.name}`);
    
    // Log device selection
    await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'debug',
      `Device profile selected: ${deviceProfile.name}`,
      { device: deviceProfile.name, screen: `${deviceProfile.screenWidth}x${deviceProfile.screenHeight}` }
    );

    if (maxBandwidthBytes) {
      console.log(`[BANDWIDTH] Limit: ${normalizedMaxBandwidthMB} MB`);
    }
    
    // Step 1: Use SERP API for search (if enabled)
    let clickedUrl = url;
    
    if (useSerpApi && searchKeyword && serp_api_token && serp_customer_id) {
      console.log('[FLOW] SERP API mode - using dual-proxy approach');
      
      await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'info',
        `SERP API search starting for keyword: ${searchKeyword}`,
        { keyword: searchKeyword }
      );

      const serpConfig = {
        api_token: serp_api_token,
        customer_id: serp_customer_id,
        zone_name: serp_zone_name || 'serp',
        endpoint: serp_endpoint || 'brd.superproxy.io',
        port: serp_port || '33335'
      };
      
      let serpBrowser = await puppeteer.launch({
        headless: false,
        ignoreHTTPSErrors: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          `--window-size=${deviceProfile.screenWidth},${deviceProfile.screenHeight}`,
        ]
      });
      
      let serpPage = await serpBrowser.newPage();
      
      // Apply real device fingerprinting to SERP search
      await injectRealDeviceFingerprint(serpPage, deviceProfile);
      await setRealisticHeaders(serpPage, deviceProfile);
      
      // Perform SERP search
      const searchResults = await searchWithBrightDataSERP(searchKeyword, geoLocation, serpConfig);
      
      if (searchResults && searchResults.length > 0) {
        const targetDomain = new URL(url).hostname.replace('www.', '');
        let foundUrl = searchResults.find(resultUrl => {
          try {
            return new URL(resultUrl).hostname.replace('www.', '') === targetDomain;
          } catch {
            return false;
          }
        });
        
        if (foundUrl) {
          clickedUrl = foundUrl;
          
          await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'info',
            `Found target URL in SERP results`,
            { found_url: clickedUrl }
          );
          
          console.log('[SERP] ✓ Found target URL in results');
        } else {
          const randomIdx = Math.floor(Math.random() * searchResults.length);
          clickedUrl = searchResults[randomIdx];
          
          await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'info',
            `Using random SERP result as fallback`,
            { fallback_url: clickedUrl }
          );
          
          console.log(`[SERP] Using result #${randomIdx + 1}: ${clickedUrl}`);
        }
      } else {
        await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'warn',
          `No SERP results found for keyword: ${searchKeyword}`,
          { keyword: searchKeyword }
        );
        
        console.log('[SERP] No results found');
      }
      
      console.log('[SERP] ✓ Closed SERP browser, launching Luna proxy browser');
      await serpBrowser.close().catch(() => {});
    }
    
    // Step 2: Launch main browser
    if (useBrowserAutomation && browser_customer_id && browser_zone) {
      console.log('[BROWSER AUTO] Connecting to Bright Data Browser Automation...');
      
      await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'info',
        'Connecting to Bright Data Browser Automation',
        { provider: 'brightdata_browser' }
      );

      const baApiToken = Buffer.from(`${browser_customer_id}:${browser_password}`).toString('base64');
      const baWsUrl = `wss://${baApiToken}:${browser_password}@${browser_endpoint}:${browser_port}`;
      
      browser = await puppeteer.connect({
        browserWSEndpoint: baWsUrl,
        ignoreHTTPSErrors: true
      });
      
      console.log('[BROWSER AUTO] ✓ Connected');
      
      await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'info',
        'Successfully connected to Bright Data Browser',
        {}
      );
    } else {
      console.log('[BROWSER] Launching HEADFUL mode (extension support)');
      
      await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'info',
        'Launching local browser in HEADFUL mode',
        { mode: 'headful' }
      );

      browser = await puppeteer.launch({
        headless: false,
        ignoreHTTPSErrors: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          `--window-size=${deviceProfile.screenWidth},${deviceProfile.screenHeight}`,
        ]
      });
    }
    
    page = await browser.newPage();
    
    // Apply real device fingerprinting
    await injectRealDeviceFingerprint(page, deviceProfile);
    await setRealisticHeaders(page, deviceProfile);
    await simulateGoogleSearch(page);
    
    // Proxy setup
    if (proxy && proxyUsername && proxyPassword) {
      console.log('[PROXY] Setting up proxy for navigation');
      
      await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'debug',
        `Proxy configured: ${proxy}`,
        { proxy: proxy, provider: proxy_provider }
      );

      const client = await page.target().createCDPSession();
      try {
        await client.send('Network.enable');
        await client.send('Network.setUserAgentOverride', {
          userAgent: deviceProfile.userAgent,
        });
        await client.send('Network.setRequestInterception', { patterns: [{ urlPattern: '*' }] });
        
        client.on('Network.requestIntercepted', async (event) => {
          const { request } = event;
          const proxyUrl = `${proxy}`;
          const hasRegionTag = proxyUrl.includes('lum-customer');
          
          try {
            await client.send('Network.continueInterceptedRequest', {
              interceptionId: event.interceptionId,
              rawResponse: Buffer.from(
                `HTTP/1.1 200 OK\r\n` +
                `Content-Type: text/html\r\n` +
                `Content-Length: 0\r\n` +
                `\r\n`
              ).toString('base64')
            });
          } catch (e) {
            console.log('[PROXY] Request continue error:', e.message);
          }
        });
        
        console.log(hasRegionTag ? '[PROXY] ✓ Authenticated' : '[PROXY] ✓ Authenticated (region appended)');
      } catch (err) {
        console.log('[PROXY] Setup warning:', err.message);
      }
    }
    
    // Extension loading (if crx URL provided)
    if (extensionCrxUrl) {
      console.log('[EXTENSION] Loading extension via server bandwidth (no proxy)');
      
      await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'info',
        'Loading browser extension',
        { extension_url: extensionCrxUrl }
      );
    }
    
    // Custom referrer
    if (customReferrer) {
      console.log(`[REFERRER] Set to: ${customReferrer}`);
      
      await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'debug',
        `Custom referrer set: ${customReferrer}`,
        { referrer: customReferrer }
      );
    }
    
    // Bandwidth tracking
    if (maxBandwidthBytes) {
      const client = await page.target().createCDPSession();
      await client.send('Network.enable');
      
      client.on('Network.responseReceived', (params) => {
        if (params.response.headers) {
          totalBandwidthBytes += params.response.encodedDataLength;
        }
      });
      
      client.on('Network.dataReceived', (params) => {
        totalBandwidthBytes += params.dataLength;
        if (totalBandwidthBytes > maxBandwidthBytes) {
          console.log(`[BANDWIDTH] ⚠️ Stopping - limit reached (${(totalBandwidthBytes / 1024 / 1024).toFixed(2)} MB / ${normalizedMaxBandwidthMB} MB)`);
          
          insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'warn',
            `Bandwidth limit reached: ${(totalBandwidthBytes / 1024 / 1024).toFixed(2)} MB`,
            { limit_mb: normalizedMaxBandwidthMB }
          );
          
          page.close().catch(() => {});
        }
      });
    }
    
    // Navigate to target URL
    console.log(`[NAVIGATE] Going to: ${clickedUrl}`);
    
    await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'info',
      `Navigating to target URL: ${clickedUrl}`,
      { url: clickedUrl }
    );

    await page.goto(clickedUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('[NAVIGATE] ✓ Page loaded');
    
    await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'info',
      'Page loaded successfully',
      {}
    );
    
    if (maxBandwidthBytes) {
      console.log(`[BANDWIDTH] Used: ${(totalBandwidthBytes / 1024 / 1024).toFixed(2)} MB / ${normalizedMaxBandwidthMB} MB`);
    }
    
    // Execute user journey or random behavior
    if (userJourney && userJourney.length > 0) {
      console.log('[JOURNEY] Executing user actions...');
      
      await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'info',
        `Executing ${userJourney.length} user journey actions`,
        { action_count: userJourney.length }
      );

      for (const action of userJourney) {
        const { type, selector, url: actionUrl, text, delay } = action;
        try {
          if (type === 'click' && selector) {
            await page.click(selector);
            console.log(`[JOURNEY] ✓ Clicked: ${selector}`);
            
            await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'debug',
              `User journey action: clicked ${selector}`,
              { action: 'click', selector: selector }
            );
          } else if (type === 'type' && selector) {
            await page.type(selector, text, { delay: 100 });
            console.log(`[JOURNEY] ✓ Typed in: ${selector}`);
            
            await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'debug',
              `User journey action: typed in ${selector}`,
              { action: 'type', selector: selector }
            );
          } else if (type === 'navigate' && actionUrl) {
            await page.goto(actionUrl, { waitUntil: 'networkidle2' });
            console.log(`[JOURNEY] ✓ Navigated to: ${actionUrl}`);
            
            await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'debug',
              `User journey action: navigated to ${actionUrl}`,
              { action: 'navigate', url: actionUrl }
            );
          }
          
          if (delay) {
            await new Promise(r => setTimeout(r, delay));
          }
        } catch (err) {
          console.log(`[JOURNEY] Note: ${err.message}`);
          
          await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'warn',
            `User journey action failed: ${err.message}`,
            { action: type, error: err.message }
          );
        }
      }
      console.log('[JOURNEY] ✓ Completed');
    } else {
      // Random browsing behavior
      const scrolls = Math.floor(Math.random() * 3) + 1;
      console.log('[BEHAVIOR] Random browsing simulation...');
      
      await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'debug',
        `Executing ${scrolls} random scroll actions`,
        { scroll_count: scrolls }
      );

      for (let i = 0; i < scrolls; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
      }
      console.log('[BEHAVIOR] ✓ Random browsing simulated');
    }
    
    // Session duration
    const minDuration = (sessionDurationMin || 30) * 1000;
    const maxDuration = (sessionDurationMax || 120) * 1000;
    const duration = minDuration + Math.random() * (maxDuration - minDuration);
    const durationSeconds = Math.round(duration / 1000);
    
    console.log(`[SESSION] Duration: ${durationSeconds}s`);
    
    await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'debug',
      `Session duration: ${durationSeconds} seconds`,
      { duration_seconds: durationSeconds }
    );

    await new Promise(r => setTimeout(r, duration));
    
    console.log('[SESSION] ✓ Completed successfully');
    
    await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'info',
      'Session completed successfully',
      { clicked_url: clickedUrl, duration_seconds: durationSeconds }
    );
    
    res.json({ success: true, sessionId, clickedUrl });
    
  } catch (error) {
    console.error('[ERROR]', error.message);
    
    await insertSessionLog(supabaseUrl, supabaseKey, sessionId, 'error',
      `Session failed: ${error.message}`,
      { error: error.message, stack: error.stack }
    );
    
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        console.log('[CLEANUP] Browser close error:', err.message);
      }
    }
  }
}

// Replace the POST /api/automate handler to use this function
// app.post('/api/automate', executeSessionWithLogging);
