const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const proxyChain = require('proxy-chain');
const { getExtensionPath } = require('./extension-loader.cjs');

puppeteer.use(StealthPlugin());

const app = express();
app.use(express.json());

// Add CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

console.log('🧪 Luna Headful Search Test Server');
console.log('📋 Testing: headless:false + Luna proxy + extension + search');

// ════════════════════════════════════════════════════════════════════════
// TEST FUNCTION: Luna Headful Search (same logic planned for server.cjs)
// ════════════════════════════════════════════════════════════════════════

async function searchWithLunaHeadful(searchKeyword, targetUrl, geoLocation, lunaConfig, extensionId = null) {
  let browser;
  let anonymizedProxy;
  const cleanup = async () => {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.log(`[LUNA HEADFUL TEST] Browser close warning: ${e.message}`);
      } finally {
        browser = null;
      }
    }
    if (anonymizedProxy) {
      try {
        await proxyChain.closeAnonymizedProxy(anonymizedProxy, true);
      } catch (e) {
        console.log(`[LUNA HEADFUL TEST] Proxy close warning: ${e.message}`);
      } finally {
        anonymizedProxy = null;
      }
    }
  };
  
  try {
    console.log(`\n[LUNA HEADFUL TEST] Starting search for: "${searchKeyword}"`);
    console.log(`[LUNA HEADFUL TEST] Target: ${targetUrl}`);
    console.log(`[LUNA HEADFUL TEST] Geo: ${geoLocation}`);
    console.log(`[LUNA HEADFUL TEST] Extension: ${extensionId || 'none'}`);
    
    const { proxy, proxyUsername, proxyPassword } = lunaConfig;
    
    if (!proxy || !proxyUsername || !proxyPassword) {
      throw new Error('Luna proxy credentials missing');
    }
    
    // Step 1: Build authenticated proxy and optional extension
    const proxyHostPort = proxy.replace(/^https?:\/\//, '');
    const authProxyUrl = `http://${proxyUsername}:${proxyPassword}@${proxyHostPort}`;

    console.log(`[LUNA HEADFUL TEST] Auth proxy URL (masked pw): http://${proxyUsername}:***@${proxyHostPort}`);

    try {
      anonymizedProxy = await proxyChain.anonymizeProxy(authProxyUrl);
      console.log(`[LUNA HEADFUL TEST] ✓ Anonymized proxy created: ${anonymizedProxy}`);
    } catch (proxyErr) {
      return {
        success: false,
        error: `Failed to create anonymized proxy: ${proxyErr.message}`,
        stage: 'proxy_setup'
      };
    }

    // Download extension if provided
    let extensionPath = null;
    if (extensionId) {
      try {
        console.log(`[LUNA HEADFUL TEST] Downloading extension: ${extensionId}`);
        extensionPath = await getExtensionPath(extensionId);
        console.log(`[LUNA HEADFUL TEST] ✓ Extension ready: ${extensionPath}`);
      } catch (error) {
        console.error(`[LUNA HEADFUL TEST] Extension download failed: ${error.message}`);
        await cleanup();
        return { 
          success: false, 
          error: `Extension download failed: ${error.message}`,
          stage: 'extension_download'
        };
      }
    }
    
    // Step 2: Build browser args
    const browserArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--proxy-bypass-list=<-loopback>',
      '--window-size=1920,1080'
    ];
    
    // Add extension args FIRST (loads from server, not proxy)
    if (extensionPath) {
      browserArgs.push(`--disable-extensions-except=${extensionPath}`);
      browserArgs.push(`--load-extension=${extensionPath}`);
      console.log(`[LUNA HEADFUL TEST] Will load extension from: ${extensionPath}`);
    }
    
    // Add proxy AFTER extension (use anonymized local proxy without auth challenges)
    browserArgs.push(`--proxy-server=${anonymizedProxy}`);
    console.log(`[LUNA HEADFUL TEST] Will use proxy (anonymized): ${anonymizedProxy}`);
    
    // Step 3: Launch browser with headless: false
    console.log(`[LUNA HEADFUL TEST] Launching browser (headless: false)...`);
    console.log(`[LUNA HEADFUL TEST] DISPLAY: ${process.env.DISPLAY || 'NOT SET'}`);
    
    try {
      browser = await puppeteer.launch({
        headless: false,
        ignoreHTTPSErrors: true,
        args: browserArgs
      });
      console.log(`[LUNA HEADFUL TEST] ✓ Browser launched successfully`);
    } catch (launchError) {
      console.error(`[LUNA HEADFUL TEST] Browser launch failed: ${launchError.message}`);
      
      const isDisplayError = launchError.message.includes('DISPLAY') || 
                            launchError.message.includes('X11') ||
                            launchError.message.includes('cannot open display');
      
      return {
        success: false,
        error: launchError.message,
        stage: 'browser_launch',
        needsXvfb: isDisplayError,
        solution: isDisplayError ? 
          'Install and start Xvfb: sudo apt-get install -y xvfb && export DISPLAY=:99 && Xvfb :99 -screen 0 1920x1080x24 &' : 
          'Check server logs for details'
      };
    }
    
    // Step 4: Create page (auth already configured in proxy URL)
    const page = await browser.newPage();
    console.log(`[LUNA HEADFUL TEST] ✓ Page created with proxy auth from browser args`);
    
    // Step 5: Warm-up to verify proxy auth (cycle through a few simple IP endpoints)
    try {
      const warmupTargets = [
        'http://ip-api.com/json/',      // plain HTTP
        'https://api.ipify.org?format=json',
        'http://ifconfig.me/ip'
      ];
      let warmed = false;
      for (const warmupUrl of warmupTargets) {
        if (warmed) break;
        try {
          console.log(`[LUNA HEADFUL TEST] Warm-up via proxy: ${warmupUrl}`);
          const warmResp = await page.goto(warmupUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
          const status = warmResp ? warmResp.status() : 'n/a';
          const body = await page.evaluate(() => document.body.innerText || '');
          console.log(`[LUNA HEADFUL TEST] Warm-up status: ${status}`);
          console.log(`[LUNA HEADFUL TEST] Warm-up body (first 200 chars): ${body.substring(0, 200)}`);
          if (status >= 200 && status < 400) {
            warmed = true;
          }
        } catch (warmTryErr) {
          console.log(`[LUNA HEADFUL TEST] Warm-up attempt failed: ${warmTryErr.message}`);
        }
      }
      if (!warmed) {
        throw new Error('All warm-up attempts failed');
      }
    } catch (warmErr) {
      await cleanup();
      return {
        success: false,
        error: `Proxy warm-up failed: ${warmErr.message}`,
        stage: 'proxy_auth'
      };
    }

    // Step 6: Navigate to Google search
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchKeyword)}&gl=${geoLocation.toLowerCase()}&hl=en&num=10`;
    console.log(`[LUNA HEADFUL TEST] Navigating to Google: ${googleUrl}`);
    
    let navigationSuccess = false;
    try {
      await page.goto(googleUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      navigationSuccess = true;
      console.log(`[LUNA HEADFUL TEST] ✓ Google page loaded`);
    } catch (navError) {
      console.log(`[LUNA HEADFUL TEST] ⚠️ Navigation timeout, trying fallback...`);
      try {
        await page.goto(googleUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        navigationSuccess = true;
        console.log(`[LUNA HEADFUL TEST] ✓ Google page loaded (fallback)`);
      } catch (fallbackError) {
        console.error(`[LUNA HEADFUL TEST] Navigation failed: ${fallbackError.message}`);
        await cleanup();
        return {
          success: false,
          error: `Navigation failed: ${fallbackError.message}`,
          stage: 'google_navigation'
        };
      }
    }
    
    // Step 7: Check for CAPTCHA/blocking
    const pageContent = await page.content();
    const pageTitle = await page.title();
    const finalUrl = page.url();
    
    const isCaptcha = pageContent.includes('recaptcha') || 
                     pageContent.includes('unusual traffic') ||
                     finalUrl.includes('/sorry');
    
    console.log(`[LUNA HEADFUL TEST] Page checks:`, {
      title: pageTitle.substring(0, 60),
      url: finalUrl.substring(0, 80),
      captcha: isCaptcha ? 'YES - BLOCKED' : 'NO',
      pageLength: pageContent.length
    });
    
    if (isCaptcha) {
      console.log(`[LUNA HEADFUL TEST] ⚠️ CAPTCHA detected - Luna proxy blocked by Google`);
      console.log(`[LUNA HEADFUL TEST] Note: This is EXPECTED with Luna residential proxies`);
      console.log(`[LUNA HEADFUL TEST] Solution: Use Browser API for search traffic (auto-CAPTCHA solving)`);
      await cleanup();
      return {
        success: false,
        blocked: true,
        captcha: true,
        message: 'Luna proxy blocked by Google (expected behavior)',
        recommendation: 'Use Browser API for search traffic',
        stage: 'search_blocked'
      };
    }
    
    // Step 7: Extract search results
    console.log(`[LUNA HEADFUL TEST] Extracting search results...`);
    
    const results = await page.evaluate(() => {
      const links = new Set();
      
      // Method 1: /url?q= pattern
      document.querySelectorAll('a[href*="/url?q="]').forEach(el => {
        try {
          const href = el.getAttribute('href');
          const match = href.match(/\/url\?q=([^&]+)/);
          if (match) {
            const decoded = decodeURIComponent(match[1]);
            if (decoded.startsWith('http') && !decoded.includes('google.com')) {
              links.add(decoded);
            }
          }
        } catch (e) {}
      });
      
      // Method 2: Direct links
      if (links.size === 0) {
        document.querySelectorAll('div[role="main"] a[href^="http"]').forEach(el => {
          const href = el.getAttribute('href');
          if (href && !href.includes('google.com') && !href.includes('youtube.com')) {
            links.add(href);
          }
        });
      }
      
      return Array.from(links).slice(0, 10);
    });
    
    console.log(`[LUNA HEADFUL TEST] ✓ Extracted ${results.length} results`);
    
    if (results.length === 0) {
      console.log(`[LUNA HEADFUL TEST] ⚠️ No results extracted - page may not have loaded properly`);
      await cleanup();
      return {
        success: false,
        error: 'No search results extracted',
        stage: 'result_extraction'
      };
    }
    
    // Step 8: Find target URL or pick random
    const targetDomain = new URL(targetUrl).hostname.replace('www.', '');
    let clickedUrl = results.find(url => {
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        return domain.includes(targetDomain) || targetDomain.includes(domain);
      } catch (e) {
        return false;
      }
    });
    
    if (!clickedUrl) {
      clickedUrl = results[Math.floor(Math.random() * Math.min(3, results.length))];
      console.log(`[LUNA HEADFUL TEST] No target match, using random result`);
    } else {
      console.log(`[LUNA HEADFUL TEST] ✓ Found target match in results`);
    }
    
    console.log(`[LUNA HEADFUL TEST] Will click: ${clickedUrl}`);
    
    // Step 9: Navigate to clicked URL
    console.log(`[LUNA HEADFUL TEST] Navigating to clicked URL...`);
    try {
      await page.goto(clickedUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`[LUNA HEADFUL TEST] ✓ Target page loaded`);
    } catch (clickNavError) {
      console.log(`[LUNA HEADFUL TEST] ⚠️ Click navigation timeout: ${clickNavError.message}`);
      // Continue anyway
    }
    
    const destinationTitle = await page.title();
    const destinationUrl = page.url();
    console.log(`[LUNA HEADFUL TEST] Destination:`, {
      title: destinationTitle.substring(0, 60),
      url: destinationUrl.substring(0, 80)
    });
    
    // Step 10: Simulate human behavior
    console.log(`[LUNA HEADFUL TEST] Simulating human behavior...`);
    for (let i = 0; i < 2; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Step 11: Dwell
    console.log(`[LUNA HEADFUL TEST] Dwelling for 5 seconds...`);
    await new Promise(r => setTimeout(r, 5000));
    
    await cleanup();
    console.log(`[LUNA HEADFUL TEST] ✓ Test completed successfully`);
    
    return {
      success: true,
      testPassed: true,
      searchResults: results,
      clickedUrl,
      destinationTitle,
      destinationUrl,
      extensionLoaded: !!extensionPath,
      proxyUsed: proxy,
      message: 'Luna headful search test passed!'
    };
    
  } catch (error) {
    console.error(`[LUNA HEADFUL TEST] Unexpected error: ${error.message}`);
    await cleanup();
    return {
      success: false,
      error: error.message,
      stage: 'unknown'
    };
  }
}

// ════════════════════════════════════════════════════════════════════════
// TEST ENDPOINTS
// ════════════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    server: 'Luna Headful Search Test Server',
    display: process.env.DISPLAY || 'NOT SET',
    platform: process.platform
  });
});

app.post('/test/luna-search', async (req, res) => {
  const {
    searchKeyword = 'best coffee shops near me',
    targetUrl = 'https://www.example.com',
    geoLocation = 'US',
    proxy = 'brd.superproxy.io:22225',
    proxyUsername,
    proxyPassword,
    extensionId = null
  } = req.body;
  
  console.log('\n' + '═'.repeat(80));
  console.log('🧪 TEST REQUEST RECEIVED');
  console.log('═'.repeat(80));
  console.log('Search:', searchKeyword);
  console.log('Target:', targetUrl);
  console.log('Geo:', geoLocation);
  console.log('Proxy:', proxy);
  console.log('Extension:', extensionId || 'none');
  console.log('═'.repeat(80) + '\n');
  
  if (!proxyUsername || !proxyPassword) {
    return res.status(400).json({
      success: false,
      error: 'Missing proxy credentials (proxyUsername, proxyPassword)'
    });
  }
  
  const lunaConfig = {
    proxy,
    proxyUsername,
    proxyPassword
  };
  
  const result = await searchWithLunaHeadful(
    searchKeyword,
    targetUrl,
    geoLocation,
    lunaConfig,
    extensionId
  );
  
  console.log('\n' + '═'.repeat(80));
  console.log('🧪 TEST RESULT');
  console.log('═'.repeat(80));
  console.log(JSON.stringify(result, null, 2));
  console.log('═'.repeat(80) + '\n');
  
  res.json(result);
});

// ════════════════════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════════════════════

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`🧪 Luna Headful Search Test Server running on port ${PORT}`);
  console.log(`${'═'.repeat(80)}`);
  console.log(`\n📋 Environment:`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   Display: ${process.env.DISPLAY || 'NOT SET (needs Xvfb for headless:false)'}`);
  console.log(`\n🔗 Endpoints:`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Test:   POST http://localhost:${PORT}/test/luna-search`);
  console.log(`\n📝 Test Scenarios:`);
  console.log(`\n   1️⃣  Basic test (no extension):`);
  console.log(`   curl -X POST http://localhost:${PORT}/test/luna-search \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"searchKeyword":"best coffee shops","targetUrl":"https://example.com","proxyUsername":"YOUR_USER","proxyPassword":"YOUR_PASS"}'`);
  console.log(`\n   2️⃣  With Luna proxy credentials:`);
  console.log(`   curl -X POST http://localhost:${PORT}/test/luna-search \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"searchKeyword":"web hosting services","targetUrl":"https://example.com","proxy":"brd.superproxy.io:22225","proxyUsername":"brd-customer-YOUR_ID-zone-residential","proxyPassword":"YOUR_PASS"}'`);
  console.log(`\n   3️⃣  With extension (requires headless:false + Xvfb):`);
  console.log(`   curl -X POST http://localhost:${PORT}/test/luna-search \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"searchKeyword":"seo tools","targetUrl":"https://example.com","proxyUsername":"YOUR_USER","proxyPassword":"YOUR_PASS","extensionId":"YOUR_EXTENSION_ID"}'`);
  console.log(`\n${'═'.repeat(80)}\n`);
});
