const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function testPuppeteerProxy() {
  console.log('🔍 Testing Puppeteer Proxy Connection\n');
  
  const proxyUrl = 'http://brd.superproxy.io:33335';
  const username = 'brd-customer-hl_a908b07a-zone-scraping_browser1';
  const password = 'dw6x0q7oe6ix';
  
  try {
    console.log('Launching browser with proxy...');
    const browser = await puppeteer.launch({
      headless: true,
      ignoreHTTPSErrors: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--test-type',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        `--proxy-server=${proxyUrl}`
      ]
    });
    
    console.log('✓ Browser launched\n');
    
    const page = await browser.newPage();
    
    // Setup authentication
    await page.authenticate({
      username: username,
      password: password
    });
    
    console.log('✓ Proxy authentication configured\n');
    
    // Add request logging
    page.on('request', (req) => {
      console.log(`[REQUEST] ${req.method()} ${req.url().substring(0, 80)}`);
    });
    
    page.on('response', (res) => {
      console.log(`[RESPONSE] ${res.status()} ${res.url().substring(0, 80)}`);
    });
    
    page.on('error', (err) => {
      console.log(`[PAGE ERROR] ${err.message}`);
    });
    
    page.on('close', () => {
      console.log(`[PAGE] Closed`);
    });
    
    // Try to navigate
    console.log('Attempting navigation to Google...');
    try {
      const response = await page.goto('https://www.google.com', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      if (response) {
        console.log(`\n✓ Navigation successful! Status: ${response.status()}`);
        
        const title = await page.title().catch(() => 'unknown');
        const url = page.url();
        
        console.log(`  Page Title: ${title}`);
        console.log(`  Final URL: ${url}`);
        
        // Check page content
        const content = await page.content();
        console.log(`  Content length: ${content.length} bytes`);
        console.log(`  Has Google search indicators: ${content.includes('google') ? 'YES' : 'NO'}`);
      }
    } catch (err) {
      console.log(`\n✗ Navigation failed: ${err.message}`);
      
      const currentUrl = page.url();
      console.log(`  Current URL: ${currentUrl}`);
      
      try {
        const content = await page.content();
        console.log(`  Content length: ${content.length} bytes`);
        
        if (currentUrl.includes('chrome-error')) {
          console.log(`  ⚠️ Chrome error page detected - proxy failed at network level`);
        }
        
        if (content.includes('Proxy')) {
          console.log(`  ⚠️ Page mentions 'Proxy' - might be proxy error`);
        }
      } catch (e) {
        console.log(`  Could not read page content: ${e.message}`);
      }
    }
    
    await browser.close();
    console.log('\n✓ Browser closed');
    
  } catch (err) {
    console.error(`\n✗ Critical error: ${err.message}`);
    console.error(err.stack);
  }
}

testPuppeteerProxy().catch(console.error);
