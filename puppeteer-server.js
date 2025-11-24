const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Add stealth plugin with all evasions
puppeteer.use(StealthPlugin());

const app = express();
app.use(express.json());

console.log('Puppeteer server with 100k+ user agents and Google search support');

// Cookie persistence directory
const COOKIES_DIR = path.join(__dirname, 'cookies');
if (!fs.existsSync(COOKIES_DIR)) {
  fs.mkdirSync(COOKIES_DIR, { recursive: true });
  console.log('[COOKIES] Created cookies directory for persistence');
}

// Load or create persistent cookies for a proxy/user combination
function loadOrCreateCookies(proxyIdentifier) {
  const cookieFile = path.join(COOKIES_DIR, `cookies_${proxyIdentifier}.json`);

  if (fs.existsSync(cookieFile)) {
    try {
      const cookies = JSON.parse(fs.readFileSync(cookieFile, 'utf8'));
      console.log(`[COOKIES] Loaded ${cookies.length} existing cookies for ${proxyIdentifier}`);
      return cookies;
    } catch (e) {
      console.log(`[COOKIES] Error loading cookies for ${proxyIdentifier}, creating new ones`);
    }
  }

  // Create new cookies
  const currentTime = Math.floor(Date.now() / 1000);
  const futureTime = currentTime + (365 * 24 * 60 * 60);

  const cookies = [
    {
      name: 'PREF',
      value: `ID=${Math.random().toString(36).substring(2, 15)}:TM=${currentTime}:LM=${currentTime}:S=${Math.random().toString(36).substring(2, 10)}`,
      domain: '.google.com',
      path: '/',
      expires: futureTime,
      httpOnly: false,
      secure: true,
      sameSite: 'None'
    },
    {
      name: 'SID',
      value: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      domain: '.google.com',
      path: '/',
      expires: futureTime,
      httpOnly: false,
      secure: true,
      sameSite: 'None'
    },
    {
      name: 'HSID',
      value: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      domain: '.google.com',
      path: '/',
      expires: futureTime,
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    },
    {
      name: 'SSID',
      value: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      domain: '.google.com',
      path: '/',
      expires: futureTime,
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    },
    {
      name: 'APISID',
      value: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      domain: '.google.com',
      path: '/',
      expires: futureTime,
      httpOnly: false,
      secure: true,
      sameSite: 'None'
    },
    {
      name: 'SAPISID',
      value: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      domain: '.google.com',
      path: '/',
      expires: futureTime,
      httpOnly: false,
      secure: true,
      sameSite: 'None'
    },
    {
      name: 'NID',
      value: `${Math.floor(Math.random() * 1000)}=${Math.random().toString(36).substring(2, 40)}`,
      domain: '.google.com',
      path: '/',
      expires: futureTime,
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    },
    {
      name: 'CONSENT',
      value: `YES+cb.${currentTime}-1-p0.en+FX+${Math.floor(Math.random() * 1000)}`,
      domain: '.google.com',
      path: '/',
      expires: futureTime,
      httpOnly: false,
      secure: true,
      sameSite: 'None'
    },
    {
      name: '1P_JAR',
      value: `${new Date().toISOString().split('T')[0]}-${Math.floor(Math.random() * 100)}`,
      domain: '.google.com',
      path: '/',
      expires: currentTime + (30 * 24 * 60 * 60),
      httpOnly: false,
      secure: true,
      sameSite: 'None'
    },
    {
      name: 'ANID',
      value: `AHWqTUn${Math.random().toString(36).substring(2, 15)}`,
      domain: '.google.com',
      path: '/',
      expires: futureTime,
      httpOnly: false,
      secure: true,
      sameSite: 'None'
    }
  ];

  // Save for future use
  fs.writeFileSync(cookieFile, JSON.stringify(cookies, null, 2));
  console.log(`[COOKIES] Created and saved ${cookies.length} new cookies for ${proxyIdentifier}`);

  return cookies;
}

// Save cookies after session (to persist any Google updates)
function saveCookies(proxyIdentifier, cookies) {
  const cookieFile = path.join(COOKIES_DIR, `cookies_${proxyIdentifier}.json`);
  try {
    fs.writeFileSync(cookieFile, JSON.stringify(cookies, null, 2));
    console.log(`[COOKIES] Saved ${cookies.length} cookies for ${proxyIdentifier}`);
  } catch (e) {
    console.log(`[COOKIES] Error saving cookies: ${e.message}`);
  }
}

// Fingerprint randomization
function getRandomFingerprint() {
  const timezones = ['America/New_York', 'America/Los_Angeles', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai', 'Australia/Sydney'];
  const languages = ['en-US,en', 'en-GB,en', 'en-CA,en', 'es-ES,es', 'fr-FR,fr', 'de-DE,de', 'ja-JP,ja', 'zh-CN,zh'];

  return {
    timezone: timezones[Math.floor(Math.random() * timezones.length)],
    language: languages[Math.floor(Math.random() * languages.length)],
    hardwareConcurrency: [2, 4, 8, 12, 16][Math.floor(Math.random() * 5)],
    deviceMemory: [2, 4, 8, 16, 32][Math.floor(Math.random() * 5)],
    screenWidth: [1920, 1366, 1440, 2560, 1536][Math.floor(Math.random() * 5)],
    screenHeight: [1080, 768, 900, 1440, 864][Math.floor(Math.random() * 5)],
  };
}

// Simulate human behavior for Google Analytics engagement tracking
async function simulateHumanBehavior(page) {
  try {
    // Random scroll patterns (GA tracks scroll depth)
    const scrolls = Math.floor(Math.random() * 4) + 2; // 2-5 scrolls
    for (let i = 0; i < scrolls; i++) {
      const scrollAmount = Math.floor(Math.random() * 500) + 200;
      await page.evaluate((amount) => {
        window.scrollBy({ top: amount, behavior: 'smooth' });
      }, scrollAmount);
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    }

    // Mouse movements (triggers engagement events)
    await page.mouse.move(Math.random() * 800, Math.random() * 600);
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.mouse.move(Math.random() * 800, Math.random() * 600);

    // Stay on page (GA4 requires 10+ seconds for "engaged session")
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

    console.log('✓ Simulated human behavior (scrolls, mouse movements, dwell time)');
  } catch (err) {
    console.log('Note: Could not simulate some behaviors:', err.message);
  }
}

// Random browsing behavior when no user journey is planned
async function randomBrowsingBehavior(page) {
  try {
    // Random scrolling
    const scrolls = Math.floor(Math.random() * 6) + 3; // 3-8 scrolls
    for (let i = 0; i < scrolls; i++) {
      const scrollAmount = Math.floor(Math.random() * 700) + 300;
      await page.evaluate((amount) => {
        window.scrollBy({ top: amount, behavior: 'smooth' });
      }, scrollAmount);
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    }

    // Try to click random links (2-4 times)
    const clicks = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < clicks; i++) {
      try {
        const clickableElements = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a, button'));
          return links
            .filter(el => el.offsetParent !== null && !el.href?.includes('#'))
            .slice(0, 20)
            .map((el, idx) => idx);
        });

        if (clickableElements.length > 0) {
          const randomIdx = clickableElements[Math.floor(Math.random() * clickableElements.length)];
          await page.evaluate((idx) => {
            const elements = Array.from(document.querySelectorAll('a, button'));
            const el = elements.filter(el => el.offsetParent !== null && !el.href?.includes('#'))[idx];
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, randomIdx);

          await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

          await page.evaluate((idx) => {
            const elements = Array.from(document.querySelectorAll('a, button'));
            const el = elements.filter(el => el.offsetParent !== null && !el.href?.includes('#'))[idx];
            if (el) {
              el.click();
              return true;
            }
            return false;
          }, randomIdx);

          console.log('✓ Clicked random element');
          await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 3000));

          // Simulate behavior on new page
          await simulateHumanBehavior(page);
        }
      } catch (err) {
        console.log('Could not click random element:', err.message);
      }
    }

    // Final dwell time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    console.log('✓ Completed random browsing behavior');
  } catch (err) {
    console.log('Error during random browsing:', err.message);
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', features: ['100k+ user agents', 'Google search flow', 'Fingerprinting'] });
});

async function downloadCrxFromWebStore(extensionId) {
  return new Promise((resolve, reject) => {
    const tempDir = path.join('/tmp', 'extensions');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const crxUrl = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=120.0&acceptformat=crx2,crx3&x=id%3D${extensionId}%26uc`;
    const fileName = path.join(tempDir, `${extensionId}.crx`);
    const file = fs.createWriteStream(fileName);

    console.log(`Downloading extension ${extensionId} from Chrome Web Store...`);

    https.get(crxUrl, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`Extension downloaded successfully to ${fileName}`);
            resolve(fileName);
          });
        }).on('error', (err) => {
          fs.unlink(fileName, () => {});
          reject(err);
        });
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Extension downloaded successfully to ${fileName}`);
          resolve(fileName);
        });
      }
    }).on('error', (err) => {
      fs.unlink(fileName, () => {});
      reject(err);
    });
  });
}

app.post('/api/automate', async (req, res) => {
  const { url, actions = [], geoLocation, proxy, proxyUsername, proxyPassword, searchKeyword, extensionCrxUrl, userJourney, sessionId, supabaseUrl, supabaseKey, customReferrer, sessionDurationMin, sessionDurationMax, useSerpApi, serpApiProvider, userId } = req.body;

  console.log(`[DEBUG] Request params - useSerpApi: ${useSerpApi}, searchKeyword: ${searchKeyword}, userId: ${userId}, hasSupabaseUrl: ${!!supabaseUrl}, hasSupabaseKey: ${!!supabaseKey}`);
  console.log(`[DEBUG] Proxy params - proxy: ${proxy}, hasProxyUsername: ${!!proxyUsername}, hasProxyPassword: ${!!proxyPassword}`);

  let browser;
  let page;
  let crxPath = null;
  let pluginLoaded = false;
  let sessionCompleted = false;
  let sessionStartTime = Date.now();

  // Calculate target session duration (in milliseconds)
  const minDuration = (sessionDurationMin || 30) * 1000; // Default 30 seconds
  const maxDuration = (sessionDurationMax || 120) * 1000; // Default 120 seconds
  const targetDuration = minDuration + Math.random() * (maxDuration - minDuration);

  console.log(`[SESSION] Target duration: ${(targetDuration / 1000).toFixed(2)} seconds`);

  // Create proxy identifier for cookie persistence (using proxy IP or sessionId)
  const proxyIdentifier = proxy
    ? proxy.replace(/[^a-zA-Z0-9]/g, '_') // Sanitize proxy URL for filename
    : sessionId || 'default';

  try {
    // Download extension WITHOUT proxy (directly from server)
    if (extensionCrxUrl) {
      console.log(`[EXTENSION] Received extension ID: ${extensionCrxUrl}`);
      console.log(`[EXTENSION] Starting download from Chrome Web Store...`);
      try {
        crxPath = await downloadCrxFromWebStore(extensionCrxUrl);
        console.log(`[EXTENSION] ✓ Successfully downloaded to: ${crxPath}`);

        // Verify file exists and has size
        const stats = fs.statSync(crxPath);
        console.log(`[EXTENSION] File size: ${(stats.size / 1024).toFixed(2)} KB`);
      } catch (downloadError) {
        console.error(`[EXTENSION] ✗ Download failed:`, downloadError.message);
        console.error(`[EXTENSION] Stack:`, downloadError.stack);
        // Continue without extension
        crxPath = null;
      }
    } else {
      console.log(`[EXTENSION] No extension ID provided, skipping download`);
    }

    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1920,1080',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-infobars',
      '--excludeSwitches=enable-automation',
      '--disable-automation',
      '--disable-blink-features=AutomationControlled',
      '--disable-default-apps',
      '--no-default-browser-check',
      '--no-service-autorun',
      '--password-store=basic',
      '--use-mock-keychain'
    ];

    if (crxPath) {
      launchArgs.push(`--disable-extensions-except=${crxPath}`);
      launchArgs.push(`--load-extension=${crxPath}`);
      console.log(`[EXTENSION] ✓ Added Chrome launch args for extension: ${crxPath}`);
      pluginLoaded = true;
    } else if (extensionCrxUrl) {
      console.log(`[EXTENSION] ✗ Extension was requested but download failed, launching without extension`);
    }

    // Determine which proxy to use: SERP API or regular proxy
    let effectiveProxy = proxy;
    let effectiveProxyUsername = proxyUsername;
    let effectiveProxyPassword = proxyPassword;

    // If SERP API is enabled for Google searches, fetch and use SERP proxy
    if (useSerpApi && searchKeyword && supabaseUrl && supabaseKey && userId) {
      console.log(`[SERP API] ===== SERP API CHECK =====`);
      console.log(`[SERP API] useSerpApi: ${useSerpApi}`);
      console.log(`[SERP API] searchKeyword: ${searchKeyword}`);
      console.log(`[SERP API] userId: ${userId}`);
      console.log(`[SERP API] serpApiProvider: ${serpApiProvider}`);
      console.log(`[SERP API] Fetching configuration...`);
      try {
        const serpConfigResponse = await fetch(`${supabaseUrl}/rest/v1/bright_data_serp_config?user_id=eq.${userId}&select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          }
        });
        const serpConfigs = await serpConfigResponse.json();
        console.log(`[SERP API] Fetched configs:`, JSON.stringify(serpConfigs, null, 2));

        if (serpConfigs && serpConfigs.length > 0 && serpConfigs[0].enabled) {
          const serpConfig = serpConfigs[0];
          console.log(`[SERP API] ✓ ${serpApiProvider} enabled, using SERP proxy`);
          console.log(`[SERP API] Config details:`, {
            api_token: serpConfig.api_token ? `${serpConfig.api_token.substring(0, 20)}...` : 'NOT SET',
            has_password: !!serpConfig.api_password,
            endpoint: serpConfig.endpoint,
            port: serpConfig.port,
            enabled: serpConfig.enabled
          });

          // Bright Data SERP API format: customer-{customer_id}-zone-{zone}-country-{country}:password@{host}:{port}
          if (serpApiProvider === 'bright_data') {
            const serpHost = serpConfig.endpoint || 'brd.superproxy.io';
            const serpPort = serpConfig.port || '33335';
            effectiveProxy = `http://${serpHost}:${serpPort}`;

            // Generate session ID for unique IP rotation
            const sessionKey = sessionId ? sessionId.substring(0, 8) : Date.now().toString(36);

            // Convert geo location to country code (US, GB, CA, etc.)
            const countryCode = geoLocation ? geoLocation.toLowerCase() : 'us';

            // Build username with country targeting and session for IP rotation
            // If api_token contains full username (brd-customer-xxx-zone-yyy), use it as base
            // Otherwise build from customer_id and zone_name
            let baseUsername;
            if (serpConfig.api_token && serpConfig.api_token.includes('brd-customer')) {
              // Full username provided in api_token field
              baseUsername = serpConfig.api_token;
            } else if (serpConfig.customer_id && serpConfig.zone_name) {
              // Build from parts
              baseUsername = `brd-customer-${serpConfig.customer_id}-zone-${serpConfig.zone_name}`;
            } else {
              throw new Error('SERP API: Either full username or customer_id + zone_name required');
            }

            // Add country targeting and session for IP rotation
            // CRITICAL: Session parameter rotates IP on each unique session ID
            effectiveProxyUsername = `${baseUsername}-country-${countryCode}-session-${sessionKey}`;
            effectiveProxyPassword = serpConfig.api_password;

            console.log(`[BRIGHT DATA] Using Bright Data proxy: ${serpHost}:${serpPort}`);
            console.log(`[BRIGHT DATA] Base username: ${baseUsername}`);
            console.log(`[BRIGHT DATA] Full proxy username: ${effectiveProxyUsername}`);
            console.log(`[BRIGHT DATA] Country: ${countryCode.toUpperCase()}`);
            console.log(`[BRIGHT DATA] Session: ${sessionKey}`);
            console.log(`[BRIGHT DATA] IP rotation: Enabled via session parameter`);
          }
        } else {
          console.log(`[SERP API] ⚠️  SERP API not configured or disabled`);
          if (!serpConfigs || serpConfigs.length === 0) {
            console.log(`[SERP API] Reason: No config found for user ${userId}`);
          } else if (!serpConfigs[0].enabled) {
            console.log(`[SERP API] Reason: Config exists but enabled=false`);
          }
          console.log(`[SERP API] Falling back to regular proxy`);
        }
      } catch (err) {
        console.error(`[SERP API] ✗ Failed to fetch SERP configuration:`, err.message);
        console.log(`[SERP API] Falling back to regular proxy`);
      }
    }

    if (effectiveProxy && effectiveProxyUsername && effectiveProxyPassword) {
      launchArgs.push(`--proxy-server=${effectiveProxy}`);
      console.log(`[PROXY] ===== FINAL PROXY CONFIGURATION =====`);
      console.log(`[PROXY] Proxy Server: ${effectiveProxy}`);
      console.log(`[PROXY] Proxy Username: ${effectiveProxyUsername}`);
      console.log(`[PROXY] Has Password: ${!!effectiveProxyPassword}`);
    } else {
      console.log(`[PROXY] ⚠️  NO PROXY CONFIGURED - Direct connection will be used`);
      console.log(`[PROXY] This may result in CAPTCHA or rate limiting`);
    }

    const launchOptions = {
      headless: 'new',
      args: launchArgs,
      timeout: 60000,
      dumpio: false,
      ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=AutomationControlled'],
      ignoreHTTPSErrors: true,
    };

    console.log('[BROWSER] Launching browser with options:', JSON.stringify({ headless: launchOptions.headless, argsCount: launchArgs.length }));
    browser = await puppeteer.launch(launchOptions);
    page = await browser.newPage();

    // Load or create persistent Google cookies for this proxy/session
    console.log(`[COOKIES] Loading persistent cookies for: ${proxyIdentifier}`);
    const googleCookies = loadOrCreateCookies(proxyIdentifier);

    await page.setCookie(...googleCookies);
    console.log(`[COOKIES] ✓ Set ${googleCookies.length} Google cookies (returning user identity)`);

    // Additional page-level evasions
    await page.evaluateOnNewDocument(() => {
      // Add realistic localStorage/sessionStorage to mimic browser with history
      try {
        // Google search history preferences
        localStorage.setItem('google_search_prefs', JSON.stringify({
          lang: 'en',
          region: 'US',
          safeSearch: 'moderate',
          resultsPerPage: 10,
          lastSearch: Date.now() - Math.floor(Math.random() * 86400000) // Within last 24h
        }));

        // Simulate previous Google sessions
        localStorage.setItem('google_session_count', String(Math.floor(Math.random() * 50) + 10)); // 10-60 sessions

        // Recent search queries (to appear as returning user)
        const recentSearches = [
          'weather today',
          'news',
          'restaurant near me',
          'how to',
          'best'
        ];
        localStorage.setItem('google_recent_searches', JSON.stringify(
          recentSearches.slice(0, Math.floor(Math.random() * 3) + 2)
        ));

        // Google Analytics client ID (GA uses this to track users)
        const gaClientId = `${Math.floor(Math.random() * 2147483647)}.${Math.floor(Date.now() / 1000)}`;
        localStorage.setItem('_ga', `GA1.2.${gaClientId}`);

        // Browser first seen timestamp
        const firstSeen = Date.now() - (Math.floor(Math.random() * 90) + 30) * 86400000; // 30-120 days ago
        localStorage.setItem('_browser_first_seen', String(firstSeen));

        // Session storage for current session
        sessionStorage.setItem('google_session_id', Math.random().toString(36).substring(2, 15));
        sessionStorage.setItem('google_session_start', String(Date.now()));
      } catch (e) {
        // In case localStorage is blocked
        console.log('[STORAGE] Could not set localStorage/sessionStorage');
      }
    });

    await page.evaluateOnNewDocument(() => {
      // Remove webdriver property completely
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Fix permissions query
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // Make chrome.runtime undefined (not present in normal Chrome)
      if (window.chrome && window.chrome.runtime) {
        delete window.chrome.runtime.sendMessage;
        delete window.chrome.runtime.connect;
      }

      // Add missing window.chrome properties
      if (!window.chrome) {
        window.chrome = {};
      }
      if (!window.chrome.app) {
        window.chrome.app = {
          isInstalled: false,
          InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
          RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
        };
      }

      // Plugins should have length > 0
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Languages should be an array
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });

    // Track plugin loaded if extension was added
    if (pluginLoaded && sessionId && supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/update-session-tracking`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            update: {
              plugin_loaded: true,
              plugin_load_timestamp: new Date().toISOString(),
              plugin_extension_id: extensionCrxUrl,
            }
          })
        });
        console.log('✓ Tracked: Plugin loaded');
      } catch (err) {
        console.error('Failed to track plugin load:', err.message);
      }
    }

    // Setup selective resource blocking based on user journey
    const allowedSelectors = userJourney ? userJourney.map(step => step.selector).filter(Boolean) : [];
    const blockResources = req.body.blockResources || [];
    const allowedDomains = req.body.allowedDomains || [];

    // Target domain to determine when to enable blocking
    const targetDomain = new URL(url).hostname;
    let blockingEnabled = false;

    // Enable request interception for journey-based blocking or resource blocking
    if (allowedSelectors.length > 0 || blockResources.length > 0) {
      await page.setRequestInterception(true);

      page.on('request', (request) => {
        const resourceType = request.resourceType();
        const requestUrl = request.url();
        const requestDomain = new URL(requestUrl).hostname;

        // Only block resources when on target domain (not during Google search)
        const isOnTargetDomain = requestDomain.includes(targetDomain) || requestUrl.includes(targetDomain);

        // If user journey defined, block images/stylesheets/fonts ONLY on target site
        if (allowedSelectors.length > 0 && isOnTargetDomain) {
          if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
            request.abort();
            return;
          }
        }

        // Check if domain is whitelisted for tracking scripts
        const isAllowedDomain = allowedDomains.some(domain => requestUrl.includes(domain));

        // Block non-essential resources ONLY on target domain, unless from allowed domains
        if (blockResources.includes(resourceType) && isOnTargetDomain && !isAllowedDomain) {
          request.abort();
        } else {
          request.continue();
        }
      });

      if (allowedSelectors.length > 0) {
        console.log(`Journey mode: Will block images/CSS/fonts on ${targetDomain}. Allowed interactions: ${allowedSelectors.join(', ')}`);
      }
      if (blockResources.length > 0) {
        console.log(`Resource blocking enabled for ${targetDomain}: ${blockResources.join(', ')}`);
        console.log(`Allowed domains: ${allowedDomains.join(', ')}`);
      }
    }

    // Authenticate proxy (use effective credentials which may be SERP API or regular)
    if (effectiveProxy && effectiveProxyUsername && effectiveProxyPassword) {
      await page.authenticate({ username: effectiveProxyUsername, password: effectiveProxyPassword });
      console.log(`[PROXY] ✓ Authenticated with proxy using ${useSerpApi && searchKeyword ? 'SERP API' : 'regular'} credentials`);
    }

    // Random realistic user agent from library (100k+ possibilities)
    // Mix of desktop (70%) and mobile (30%)
    const deviceCategories = ['desktop', 'desktop', 'desktop', 'desktop', 'desktop', 'desktop', 'desktop', 'mobile', 'mobile', 'mobile'];
    const randomDeviceCategory = deviceCategories[Math.floor(Math.random() * deviceCategories.length)];
    const userAgentObj = new UserAgent({ deviceCategory: randomDeviceCategory });
    const userAgent = userAgentObj.toString();
    await page.setUserAgent(userAgent);
    console.log(`Using ${randomDeviceCategory} user agent: ${userAgent.substring(0, 80)}...`);

    // Random fingerprint
    const fingerprint = getRandomFingerprint();

    // Adjust viewport based on device type
    let viewportWidth, viewportHeight;
    if (randomDeviceCategory === 'mobile') {
      // Mobile viewports
      const mobileViewports = [
        { width: 375, height: 667 },   // iPhone SE, 6, 7, 8
        { width: 414, height: 896 },   // iPhone XR, 11
        { width: 390, height: 844 },   // iPhone 12, 13
        { width: 393, height: 852 },   // iPhone 14, 15
        { width: 360, height: 800 },   // Samsung Galaxy S20
        { width: 412, height: 915 },   // Samsung Galaxy S21+
      ];
      const mobileViewport = mobileViewports[Math.floor(Math.random() * mobileViewports.length)];
      viewportWidth = mobileViewport.width;
      viewportHeight = mobileViewport.height;
    } else {
      // Desktop viewports
      viewportWidth = fingerprint.screenWidth;
      viewportHeight = fingerprint.screenHeight;
    }

    await page.setViewport({
      width: viewportWidth,
      height: viewportHeight,
      isMobile: randomDeviceCategory === 'mobile',
      hasTouch: randomDeviceCategory === 'mobile',
    });

    // Enhanced fingerprint evasion (supplementing stealth plugin)
    await page.evaluateOnNewDocument((fp) => {
      // Additional WebDriver masking
      delete Object.getPrototypeOf(navigator).webdriver;
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
        configurable: true
      });

      // Override permissions API to return realistic values
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // Randomize navigator properties
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fp.hardwareConcurrency });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => fp.deviceMemory });
      Object.defineProperty(navigator, 'language', { get: () => fp.language.split(',')[0] });
      Object.defineProperty(navigator, 'languages', { get: () => fp.language.split(',') });

      // Enhanced canvas fingerprint noise
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;
      const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

      const noisify = (canvas, context) => {
        const shift = {
          r: Math.floor(Math.random() * 10) - 5,
          g: Math.floor(Math.random() * 10) - 5,
          b: Math.floor(Math.random() * 10) - 5,
          a: Math.floor(Math.random() * 10) - 5
        };

        const width = canvas.width;
        const height = canvas.height;
        if (width && height) {
          const imageData = originalGetImageData.apply(context, [0, 0, width, height]);
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i + 0] = imageData.data[i + 0] + shift.r;
            imageData.data[i + 1] = imageData.data[i + 1] + shift.g;
            imageData.data[i + 2] = imageData.data[i + 2] + shift.b;
            imageData.data[i + 3] = imageData.data[i + 3] + shift.a;
          }
          context.putImageData(imageData, 0, 0);
        }
      };

      HTMLCanvasElement.prototype.toDataURL = function() {
        noisify(this, this.getContext('2d'));
        return originalToDataURL.apply(this, arguments);
      };

      HTMLCanvasElement.prototype.toBlob = function() {
        noisify(this, this.getContext('2d'));
        return originalToBlob.apply(this, arguments);
      };

      // Enhanced WebGL fingerprint randomization
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        const glVendors = ['Intel Inc.', 'NVIDIA Corporation', 'ATI Technologies Inc.'];
        const glRenderers = [
          'Intel Iris OpenGL Engine',
          'NVIDIA GeForce GTX 1060',
          'AMD Radeon RX 580',
          'Intel HD Graphics 630'
        ];
        if (parameter === 37445) {
          return glVendors[Math.floor(Math.random() * glVendors.length)];
        }
        if (parameter === 37446) {
          return glRenderers[Math.floor(Math.random() * glRenderers.length)];
        }
        return getParameter.apply(this, arguments);
      };

      // Audio fingerprint randomization
      const audioContext = window.AudioContext || window.webkitAudioContext;
      if (audioContext) {
        const originalCreateOscillator = audioContext.prototype.createOscillator;
        audioContext.prototype.createOscillator = function() {
          const oscillator = originalCreateOscillator.apply(this, arguments);
          const originalStart = oscillator.start;
          oscillator.start = function() {
            const args = Array.from(arguments);
            args[0] = args[0] + (Math.random() * 0.0001);
            return originalStart.apply(this, args);
          };
          return oscillator;
        };
      }

      // Screen fingerprint with random offset
      Object.defineProperty(screen, 'availWidth', {
        get: () => fp.screenWidth
      });
      Object.defineProperty(screen, 'availHeight', {
        get: () => fp.screenHeight
      });
      Object.defineProperty(screen, 'width', {
        get: () => fp.screenWidth
      });
      Object.defineProperty(screen, 'height', {
        get: () => fp.screenHeight
      });

      // Battery API randomization
      if ('getBattery' in navigator) {
        const originalGetBattery = navigator.getBattery;
        navigator.getBattery = () => {
          return originalGetBattery.apply(navigator).then(battery => {
            Object.defineProperty(battery, 'level', {
              get: () => 0.5 + Math.random() * 0.5
            });
            return battery;
          });
        };
      }

      // Timezone consistency
      Intl.DateTimeFormat = class extends Intl.DateTimeFormat {
        constructor(...args) {
          super(...args);
          const original = this.resolvedOptions;
          this.resolvedOptions = () => ({
            ...original.call(this),
            timeZone: fp.timezone
          });
        }
      };

      // Enhanced Chrome runtime
      window.chrome = {
        app: { isInstalled: false },
        webstore: { onInstallStageChanged: {}, onDownloadProgress: {} },
        runtime: {
          PlatformOs: { MAC: 'mac', WIN: 'win', ANDROID: 'android', CROS: 'cros', LINUX: 'linux', OPENBSD: 'openbsd' },
          PlatformArch: { ARM: 'arm', X86_32: 'x86-32', X86_64: 'x86-64' },
          PlatformNaclArch: { ARM: 'arm', X86_32: 'x86-32', X86_64: 'x86-64' },
          RequestUpdateCheckStatus: { THROTTLED: 'throttled', NO_UPDATE: 'no_update', UPDATE_AVAILABLE: 'update_available' },
          OnInstalledReason: { INSTALL: 'install', UPDATE: 'update', CHROME_UPDATE: 'chrome_update', SHARED_MODULE_UPDATE: 'shared_module_update' },
          OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' }
        }
      };

      // Mock plugins with realistic values
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
          { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' }
        ]
      });

      // Connection type randomization
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          effectiveType: ['4g', '3g', '4g', '4g'][Math.floor(Math.random() * 4)],
          rtt: Math.floor(Math.random() * 100) + 50,
          downlink: Math.random() * 10 + 1,
          saveData: false
        })
      });

      // Mouse event timing variation
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'mousemove' || type === 'mousedown' || type === 'mouseup') {
          const wrappedListener = function(e) {
            setTimeout(() => listener.call(this, e), Math.random() * 2);
          };
          return originalAddEventListener.call(this, type, wrappedListener, options);
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
    }, fingerprint);

    const results = [];

    // GOOGLE SEARCH FLOW
    if (searchKeyword) {
      console.log(`Performing Google search for: "${searchKeyword}"`);

      // NEW APPROACH: Skip Google homepage, go directly to search results
      // This mimics clicking a bookmark or typing URL directly - less suspicious
      console.log('[GOOGLE] Using direct search URL approach (bypassing homepage)');
      const encodedQuery = encodeURIComponent(searchKeyword);
      const searchUrl = `https://www.google.com/search?q=${encodedQuery}`;

      // CRITICAL: Warm up the session by visiting Google homepage first
      // This establishes a natural browsing pattern before searching
      console.log('[GOOGLE] Step 0: Warming up session with Google homepage...');
      try {
        await page.goto('https://www.google.com/', { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('[GOOGLE] ✓ Google homepage loaded');

        // Detect actual IP address used by this session (for tracking/rotation)
        let actualIP = 'unknown';
        try {
          actualIP = await page.evaluate(async () => {
            // Try multiple IP detection services with fallbacks
            const services = [
              { url: 'https://api.ipify.org?format=json', type: 'json', key: 'ip' },
              { url: 'https://api.my-ip.io/ip.json', type: 'json', key: 'ip' },
              { url: 'https://ifconfig.me/ip', type: 'text', key: null }
            ];

            for (const service of services) {
              try {
                const response = await fetch(service.url, {
                  signal: AbortSignal.timeout(5000)
                });

                if (!response.ok) continue;

                if (service.type === 'json') {
                  const contentType = response.headers.get('content-type') || '';
                  if (!contentType.includes('application/json')) continue;

                  const data = await response.json();
                  const ip = data[service.key] || data.IP;
                  if (ip && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
                    return ip;
                  }
                } else {
                  const text = await response.text();
                  const ip = text.trim();
                  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
                    return ip;
                  }
                }
              } catch (err) {
                continue;
              }
            }
            return 'unknown';
          });

          if (actualIP !== 'unknown') {
            console.log(`[IP DETECTION] ✓ Session using IP: ${actualIP}`);
          } else {
            console.log(`[IP DETECTION] ⚠️  All IP detection services failed or returned invalid data`);
          }

          // Track this IP usage in database (only if we successfully detected an IP)
          console.log(`[IP TRACKING] Pre-check - IP: ${actualIP}, sessionId: ${!!sessionId}, supabaseUrl: ${!!supabaseUrl}, supabaseKey: ${!!supabaseKey}, userId: ${!!userId}`);

          if (actualIP !== 'unknown' && sessionId && supabaseUrl && supabaseKey && userId) {
            try {
              console.log(`[IP TRACKING] Fetching campaign for session ${sessionId}...`);
              const { data: campaignData } = await fetch(`${supabaseUrl}/rest/v1/bot_sessions?id=eq.${sessionId}&select=campaign_id`, {
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                }
              }).then(r => r.json());

              console.log(`[IP TRACKING] Campaign data:`, campaignData);
              const campaignId = campaignData && campaignData[0] ? campaignData[0].campaign_id : null;

              if (campaignId) {
                console.log(`[IP TRACKING] Inserting IP ${actualIP} for campaign ${campaignId}...`);
                const insertResponse = await fetch(`${supabaseUrl}/rest/v1/session_ip_tracking`, {
                  method: 'POST',
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                  },
                  body: JSON.stringify({
                    session_id: sessionId,
                    ip_address: actualIP,
                    country_code: geoLocation || 'US',
                    campaign_id: campaignId,
                    user_id: userId
                  })
                });

                if (!insertResponse.ok) {
                  const errorText = await insertResponse.text();
                  console.log(`[IP TRACKING] ✗ Insert failed: ${insertResponse.status} - ${errorText}`);
                } else {
                  console.log(`[IP TRACKING] ✓ Tracked IP ${actualIP} for session ${sessionId}`);
                }
              } else {
                console.log(`[IP TRACKING] ⚠️  No campaign ID found for session ${sessionId}`);
              }
            } catch (trackError) {
              console.log(`[IP TRACKING] ⚠️  Could not track IP: ${trackError.message}`);
              console.log(`[IP TRACKING] Stack:`, trackError.stack);
            }
          } else if (actualIP === 'unknown') {
            console.log(`[IP TRACKING] ⚠️  Skipping IP tracking - could not detect IP address`);
          } else {
            console.log(`[IP TRACKING] ⚠️  Skipping IP tracking - missing required parameters`);
          }
        } catch (ipError) {
          console.log(`[IP DETECTION] ⚠️  Could not detect IP: ${ipError.message}`);
        }

        // Simulate real user behavior on homepage
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
        await page.mouse.move(Math.random() * 300 + 100, Math.random() * 200 + 100);
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        // Scroll a bit
        await page.evaluate(() => window.scrollBy({ top: 100, behavior: 'smooth' }));
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
      } catch (error) {
        console.log('[GOOGLE] ⚠️  Failed to load homepage, continuing anyway...');
      }

      console.log('[GOOGLE] Step 1: Navigating to search results...');
      try {
        // Add extra headers to look more legitimate
        await page.setExtraHTTPHeaders({
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': fingerprint.language,
          'Cache-Control': 'max-age=0',
          'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          'Sec-Ch-Ua-Mobile': randomDeviceCategory === 'mobile' ? '?1' : '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Referer': 'https://www.google.com/',
        });

        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log('[GOOGLE] ✓ Successfully loaded search results');

        // Check for CAPTCHA or unusual traffic detection
        const pageContent = await page.content();
        const pageTitle = await page.title();

        if (pageContent.includes('unusual traffic') ||
            pageContent.includes('automated requests') ||
            pageContent.includes('captcha') ||
            pageTitle.includes('sorry')) {
          console.log('[GOOGLE] ⚠️  CAPTCHA/Unusual traffic detected!');
          console.log('[GOOGLE] This proxy may be flagged. Consider:');
          console.log('[GOOGLE]   1. Using a different proxy');
          console.log('[GOOGLE]   2. Waiting longer between requests');
          console.log('[GOOGLE]   3. Using residential proxies instead of datacenter');

          // Mark session with captcha flag
          if (sessionId && supabaseUrl && supabaseKey) {
            try {
              await fetch(`${supabaseUrl}/functions/v1/update-session-tracking`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  sessionId,
                  update: {
                    google_captcha_encountered: true,
                    error_message: 'Google CAPTCHA or unusual traffic warning'
                  }
                })
              });
            } catch (err) {
              console.error('Failed to track CAPTCHA encounter:', err.message);
            }
          }

          throw new Error('Google CAPTCHA detected - proxy may be flagged');
        }

        // Natural delay - mimic human reading results
        await new Promise(resolve => setTimeout(resolve, 4000 + Math.random() * 3000));

        // Simulate mouse movement and scrolling
        await page.mouse.move(Math.random() * 400 + 200, Math.random() * 300 + 100);
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));

        await page.evaluate(() => {
          window.scrollBy({ top: 200, behavior: 'smooth' });
        });
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

        await page.mouse.move(Math.random() * 400 + 200, Math.random() * 400 + 200);
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        results.push({ action: 'google_visit', success: true });
        results.push({ action: 'google_search', keyword: searchKeyword, success: true });
      } catch (error) {
        console.error('[GOOGLE] ✗ Failed to load search results:', error.message);
        throw error;
      }

      // Track: Google search attempted
      if (sessionId && supabaseUrl && supabaseKey) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/update-session-tracking`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              update: {
                google_search_attempted: true,
                google_search_timestamp: new Date().toISOString(),
              }
            })
          });
          console.log('✓ Tracked: Google search attempted');
        } catch (err) {
          console.error('Failed to track Google search attempt:', err.message);
        }
      }

      // We already loaded search results directly above, no need to type/search

      // Track: Google search completed (results loaded)
      if (sessionId && supabaseUrl && supabaseKey) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/update-session-tracking`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              update: {
                google_search_completed: true,
              }
            })
          });
          console.log('✓ Tracked: Google search completed');
        } catch (err) {
          console.error('Failed to track Google search completion:', err.message);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      // Take screenshot for debugging
      try {
        const screenshot = await page.screenshot({ encoding: 'base64' });
        console.log('[GOOGLE] Screenshot captured (base64 length):', screenshot.length);
      } catch (err) {
        console.log('[GOOGLE] Could not capture screenshot:', err.message);
      }

      // Check if we got blocked or CAPTCHAed
      const pageContent = await page.content();
      if (pageContent.includes('unusual traffic') || pageContent.includes('captcha') || pageContent.includes('automated')) {
        console.error('[GOOGLE] ⚠️  DETECTED: Google detected unusual traffic or automation!');
        console.log('[GOOGLE] Page title:', await page.title());
      }

      // Try to find and click the target URL in results
      const targetDomain = new URL(url).hostname.replace('www.', '');
      console.log(`[GOOGLE SEARCH] Looking for domain: ${targetDomain} in search results`);

      // Look for link containing target domain - improved logic
      const searchResult = await page.evaluate((domain, targetUrl) => {
        // Get all search result links (Google uses specific selectors)
        const resultLinks = Array.from(document.querySelectorAll('a[href]'));

        // Filter for actual search result links (not navigation, ads, etc)
        const searchResults = resultLinks.filter(link => {
          const href = link.href;
          // Exclude Google's own links
          if (href.includes('google.com') || href.includes('accounts.google')) return false;
          // Exclude fragments and javascript
          if (href.startsWith('#') || href.startsWith('javascript:')) return false;
          return true;
        });

        // First, try exact domain match
        for (const link of searchResults) {
          try {
            const linkDomain = new URL(link.href).hostname.replace('www.', '');
            if (linkDomain === domain) {
              link.scrollIntoView({ behavior: 'smooth', block: 'center' });
              return { found: link.href, allUrls: searchResults.slice(0, 10).map(l => l.href) };
            }
          } catch (e) {
            // Invalid URL, skip
          }
        }

        // Fallback: Try partial domain match
        for (const link of searchResults) {
          if (link.href.includes(domain)) {
            link.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return { found: link.href, allUrls: searchResults.slice(0, 10).map(l => l.href) };
          }
        }

        return { found: null, allUrls: searchResults.slice(0, 10).map(l => l.href) };
      }, targetDomain, url);

      const linkFound = searchResult.found;

      // Log what we found (or didn't find)
      console.log(`[GOOGLE SEARCH] Total filtered results: ${searchResult.allUrls.length}`);
      console.log(`[GOOGLE SEARCH] First 10 result URLs:`, JSON.stringify(searchResult.allUrls, null, 2));

      if (linkFound) {
        console.log(`[GOOGLE SEARCH] ✓ Found target URL in search results: ${linkFound}`);

        // Track: Search result found
        if (sessionId && supabaseUrl && supabaseKey) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/update-session-tracking`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId,
                update: {
                  google_search_result_clicked: true,
                  google_search_clicked_url: linkFound,
                }
              })
            });
            console.log(`✓ Tracked: Google search result found - URL: ${linkFound}`);
          } catch (err) {
            console.error('Failed to track search result:', err.message);
          }
        }

        // CRITICAL: Switch from SERP proxy to Luna/Residential proxy for target site
        // Close current browser (using SERP proxy)
        console.log('[PROXY SWITCH] Step 6: Closing SERP proxy browser...');
        await browser.close();
        console.log('[PROXY SWITCH] ✓ SERP proxy browser closed');

        // Check if Luna proxy is configured
        if (!proxy || !proxyUsername || !proxyPassword) {
          throw new Error('Luna/Residential proxy credentials required for target site visit. Configure in campaign settings.');
        }

        // Launch NEW browser with Luna/Residential proxy
        console.log('[PROXY SWITCH] Step 7: Launching new browser with Luna/Residential proxy...');
        console.log(`[PROXY SWITCH] Luna proxy: ${proxy}`);
        console.log(`[PROXY SWITCH] Luna username: ${proxyUsername}`);

        const lunaArgs = [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          `--proxy-server=${proxy}`,
        ];

        if (process.env.DISPLAY && process.env.DISPLAY.includes(':99')) {
          lunaArgs.push('--display=:99');
        }

        browser = await puppeteer.launch({
          args: lunaArgs,
          headless: true,
          ignoreHTTPSErrors: true,
          defaultViewport: null,
        });

        const pages = await browser.pages();
        page = pages[0] || await browser.newPage();

        // Authenticate Luna proxy
        await page.authenticate({ username: proxyUsername, password: proxyPassword });
        console.log('[PROXY SWITCH] ✓ Authenticated with Luna/Residential proxy');

        // Apply stealth and fingerprint again
        await StealthPlugin().onPageCreated(page);

        const fingerprint = getRandomFingerprint();
        await page.setUserAgent(fingerprint.userAgent);
        await page.setViewport({
          width: fingerprint.screenWidth,
          height: fingerprint.screenHeight,
          isMobile: randomDeviceCategory === 'mobile',
          hasTouch: randomDeviceCategory === 'mobile',
        });

        await page.evaluateOnNewDocument((fp) => {
          delete Object.getPrototypeOf(navigator).webdriver;
          Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
            configurable: true
          });
          Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fp.hardwareConcurrency });
          Object.defineProperty(navigator, 'deviceMemory', { get: () => fp.deviceMemory });
          Object.defineProperty(navigator, 'languages', { get: () => [fp.language, 'en-US', 'en'] });
          Object.defineProperty(navigator, 'platform', { get: () => fp.platform });
        }, fingerprint);

        console.log('[PROXY SWITCH] Step 8: Navigating to target site with Luna proxy...');

        // Set referrer to Google search (natural referrer flow)
        const googleReferrer = customReferrer || `https://www.google.com/search?q=${encodeURIComponent(searchKeyword)}`;
        await page.setExtraHTTPHeaders({
          'Referer': googleReferrer,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': fingerprint.language,
        });

        try {
          await page.goto(linkFound, { waitUntil: 'networkidle2', timeout: 60000 });
          console.log('[PROXY SWITCH] ✓ Successfully navigated to target site with Luna proxy');
          results.push({ action: 'proxy_switch', from: 'serp', to: 'luna', success: true });
        } catch (error) {
          console.error('[PROXY SWITCH] ✗ Navigation failed:', error.message);
          throw error;
        }

        // Wait for analytics to fully load (GA4 needs time to initialize)
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Simulate human behavior for Google Analytics engagement
        await simulateHumanBehavior(page);

        // Track: Target site reached
        if (sessionId && supabaseUrl && supabaseKey) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/update-session-tracking`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId,
                update: {
                    target_site_reached_timestamp: new Date().toISOString(),
                  }
                })
              });
              console.log('✓ Tracked: Target site reached');
            } catch (err) {
              console.error('Failed to track target site reach:', err.message);
            }
        }

        // Track: Plugin active (after reaching target site from search)
        if (pluginLoaded && sessionId && supabaseUrl && supabaseKey) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for plugin to initialize
          try {
            await fetch(`${supabaseUrl}/functions/v1/update-session-tracking`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId,
                update: {
                  plugin_active: true,
                }
              })
            });
            console.log('✓ Tracked: Plugin active');
          } catch (err) {
            console.error('Failed to track plugin activity:', err.message);
          }
        }
      } else {
        console.log(`[GOOGLE SEARCH] ✗ Target domain "${targetDomain}" NOT FOUND in search results`);
        console.log(`[GOOGLE SEARCH] Search keyword was: "${searchKeyword}"`);
        console.log(`[GOOGLE SEARCH] Falling back to direct navigation...`);

        // Track that we couldn't find the domain
        if (sessionId && supabaseUrl && supabaseKey) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/update-session-tracking`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId,
                update: {
                  google_search_clicked_url: 'NOT_FOUND_IN_RESULTS',
                }
              })
            });
          } catch (err) {
            console.error('Failed to track not found:', err.message);
          }
        }

        // Set custom referrer even for fallback navigation
        if (customReferrer) {
          console.log(`[REFERRER] Setting custom referrer for fallback: ${customReferrer}`);
          await page.setExtraHTTPHeaders({
            'Referer': customReferrer
          });
        }

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for analytics to fully load
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Simulate human behavior for Google Analytics engagement
        await simulateHumanBehavior(page);

        results.push({ action: 'direct_fallback', reason: 'not_in_search_results', success: true });

        // Track: Plugin active (after direct fallback navigation)
        if (pluginLoaded && sessionId && supabaseUrl && supabaseKey) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            await fetch(`${supabaseUrl}/functions/v1/update-session-tracking`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId,
                update: {
                  plugin_active: true,
                }
              })
            });
            console.log('✓ Tracked: Plugin active');
          } catch (err) {
            console.error('Failed to track plugin activity:', err.message);
          }
        }
      }
  } else {
      // Direct navigation
      // Set custom referrer if provided
      if (customReferrer) {
        console.log(`[REFERRER] Setting custom referrer for direct traffic: ${customReferrer}`);
        await page.setExtraHTTPHeaders({
          'Referer': customReferrer
        });
      }

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      console.log('✓ Direct navigation to target site');

      // Wait for analytics to fully load
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Simulate human behavior for Google Analytics engagement
      await simulateHumanBehavior(page);

      results.push({ action: 'direct_visit', success: true });

      // Track: Plugin active (after direct navigation)
      if (pluginLoaded && sessionId && supabaseUrl && supabaseKey) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          await fetch(`${supabaseUrl}/functions/v1/update-session-tracking`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              update: {
                plugin_active: true,
              }
            })
          });
          console.log('✓ Tracked: Plugin active');
        } catch (err) {
          console.error('Failed to track plugin activity:', err.message);
        }
      }
    }

    // Execute user journey OR random browsing behavior, respecting target duration
    const timeSpentSoFar = Date.now() - sessionStartTime;
    const timeRemaining = Math.max(0, targetDuration - timeSpentSoFar);

    console.log(`[SESSION] Time spent: ${(timeSpentSoFar / 1000).toFixed(2)}s, Time remaining: ${(timeRemaining / 1000).toFixed(2)}s`);

    if (userJourney && userJourney.length > 0) {
      console.log(`Executing planned user journey with ${userJourney.length} steps`);
      for (const step of userJourney) {
        // Check if we've exceeded target duration
        if (Date.now() - sessionStartTime >= targetDuration) {
          console.log('[SESSION] Target duration reached, stopping user journey');
          break;
        }

        if (step.action_type === 'click' && step.selector) {
          try {
            await page.waitForSelector(step.selector, { timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));
            await page.click(step.selector);
            console.log(`✓ Clicked: ${step.selector}`);
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

            // Simulate behavior after each click
            await simulateHumanBehavior(page);
          } catch (err) {
            console.log(`✗ Could not click ${step.selector}: ${err.message}`);
          }
        } else if (step.action_type === 'wait') {
          const waitTime = step.wait_time || 5000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          console.log(`✓ Waited: ${waitTime}ms`);
        }
      }
    } else {
      // No journey planned - perform random browsing behavior
      console.log('No user journey planned - executing random browsing behavior');
      await randomBrowsingBehavior(page);
    }

    // Fill remaining time if needed
    const finalTimeSpent = Date.now() - sessionStartTime;
    const finalTimeRemaining = Math.max(0, targetDuration - finalTimeSpent);

    if (finalTimeRemaining > 0) {
      console.log(`[SESSION] Filling remaining ${(finalTimeRemaining / 1000).toFixed(2)}s with dwell time`);
      await new Promise(resolve => setTimeout(resolve, finalTimeRemaining));
    }

    const totalSessionTime = Date.now() - sessionStartTime;
    console.log(`[SESSION] Total session time: ${(totalSessionTime / 1000).toFixed(2)}s (target was ${(targetDuration / 1000).toFixed(2)}s)`);

    // Execute any additional legacy actions
    for (const action of actions) {
      if (action.type === 'click' && action.selector) {
        await page.waitForSelector(action.selector, { timeout: 60000 });
        await page.click(action.selector);
        results.push({ action: 'click', selector: action.selector, success: true });
        if (action.wait) await new Promise(resolve => setTimeout(resolve, action.wait));
      } else if (action.type === 'wait' && action.duration) {
        await new Promise(resolve => setTimeout(resolve, action.duration));
        results.push({ action: 'wait', duration: action.duration, success: true });
      }
    }

    const screenshot = await page.screenshot({ encoding: 'base64' });

    await browser.close();

    // Mark session as completed with final tracking data
    if (sessionId && supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/update-session-tracking`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            update: {
              status: 'completed',
              completed_at: new Date().toISOString(),
              user_agent: userAgent,
              device_type: randomDeviceCategory,
              viewport_width: viewportWidth,
              viewport_height: viewportHeight,
            }
          })
        });
        console.log('✓ Session marked as completed');
      } catch (err) {
        console.error('Failed to mark session complete:', err.message);
      }
    }

    if (crxPath) {
      try {
        fs.unlinkSync(crxPath);
        console.log(`Cleaned up extension file: ${crxPath}`);
      } catch (err) {
        console.error('Failed to delete CRX file:', err);
      }
    }

    // Save cookies before closing browser (to persist any Google updates)
    if (page) {
      try {
        const finalCookies = await page.cookies();
        saveCookies(proxyIdentifier, finalCookies);
      } catch (e) {
        console.log('[COOKIES] Could not save cookies:', e.message);
      }
    }

    res.json({ success: true, results, screenshot, userAgent, deviceType: randomDeviceCategory });

  } catch (error) {
    // Try to save cookies even on error
    if (browser && page) {
      try {
        const finalCookies = await page.cookies();
        saveCookies(proxyIdentifier, finalCookies);
      } catch (e) {
        console.log('[COOKIES] Could not save cookies on error:', e.message);
      }
    }

    if (browser) await browser.close();
    if (crxPath) {
      try {
        fs.unlinkSync(crxPath);
      } catch (err) {
        console.error('Failed to delete CRX file:', err);
      }
    }

    // Mark session as failed
    if (sessionId && supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/update-session-tracking`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            update: {
              status: 'failed',
              error_message: error.message,
              completed_at: new Date().toISOString(),
            }
          })
        });
        console.log('✓ Session marked as failed');
      } catch (err) {
        console.error('Failed to mark session as failed:', err.message);
      }
    }

    console.error('Automation error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Puppeteer server running on port 3000 with Google search support');
});
