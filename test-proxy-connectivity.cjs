const axios = require('axios');
const https = require('https');
const dns = require('dns').promises;

async function testProxyConnectivity() {
  console.log('🔍 Testing Bright Data HTTP Proxy Connectivity\n');
  
  const proxyEndpoint = 'brd.superproxy.io';
  const proxyPort = 33335;
  const proxyUrl = `http://${proxyEndpoint}:${proxyPort}`;
  
  // Test 1: DNS Resolution
  console.log('Test 1: DNS Resolution');
  try {
    const ips = await dns.resolve4(proxyEndpoint);
    console.log(`✓ DNS resolved ${proxyEndpoint} to: ${ips.join(', ')}`);
  } catch (err) {
    console.log(`✗ DNS resolution failed: ${err.message}`);
  }
  
  // Test 2: Basic connectivity to proxy
  console.log('\nTest 2: Basic TCP Connection to Proxy');
  try {
    const net = require('net');
    const socket = net.createConnection({ host: proxyEndpoint, port: proxyPort, timeout: 5000 });
    
    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log(`✓ TCP connection successful to ${proxyEndpoint}:${proxyPort}`);
        socket.destroy();
        resolve();
      });
      socket.on('error', (err) => {
        console.log(`✗ TCP connection failed: ${err.message}`);
        reject(err);
      });
      socket.on('timeout', () => {
        console.log(`✗ TCP connection timeout`);
        socket.destroy();
        reject(new Error('Timeout'));
      });
    });
  } catch (err) {
    console.log(`✗ Connection test error: ${err.message}`);
  }
  
  // Test 3: CONNECT tunnel to Google (HTTPS proxy method)
  console.log('\nTest 3: CONNECT Tunnel to Google (HTTPS via Proxy)');
  try {
    const http = require('http');
    const options = {
      hostname: 'www.google.com',
      port: 443,
      path: '/',
      method: 'GET',
      agent: new http.Agent({
        host: proxyEndpoint,
        port: proxyPort,
        timeout: 10000
      }),
      headers: {
        'Proxy-Authorization': `Basic ${Buffer.from('dummy:dummy').toString('base64')}`
      }
    };
    
    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, resolve);
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.end();
    });
    
    console.log(`✓ CONNECT tunnel test: Server responded with status (can retrieve headers)`);
  } catch (err) {
    console.log(`⚠️ CONNECT tunnel test: ${err.message} (expected - proxy requires auth)`);
  }
  
  // Test 4: Proxy with proper Bright Data credentials format
  console.log('\nTest 4: HTTP Request Through Proxy (with auth)');
  const username = 'brd-customer-hl_a908b07a-zone-scraping_browser1';
  const password = 'dw6x0q7oe6ix';
  
  try {
    const agent = new https.Agent({
      rejectUnauthorized: false
    });
    
    const response = await axios.get('https://www.google.com', {
      proxy: {
        protocol: 'http',
        host: proxyEndpoint,
        port: proxyPort,
        auth: {
          username: username,
          password: password
        }
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: () => true,
      httpsAgent: agent,
      httpAgent: agent
    });
    
    console.log(`✓ Proxy request successful: Status ${response.status}`);
    console.log(`  Response size: ${response.data ? response.data.length : 0} bytes`);
    if (response.data && response.data.includes('google')) {
      console.log(`  ✓ Received valid Google response`);
    }
  } catch (err) {
    console.log(`✗ Proxy request failed: ${err.message}`);
  }
  
  // Test 5: Google Search via proxy
  console.log('\nTest 5: Google Search Request via Proxy');
  try {
    const searchUrl = 'https://www.google.com/search?q=test&num=10';
    
    const agent = new https.Agent({
      rejectUnauthorized: false
    });
    
    const response = await axios.get(searchUrl, {
      proxy: {
        protocol: 'http',
        host: proxyEndpoint,
        port: proxyPort,
        auth: {
          username: username,
          password: password
        }
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: () => true,
      httpsAgent: agent,
      httpAgent: agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`✓ Google Search request successful: Status ${response.status}`);
    console.log(`  Response size: ${response.data ? response.data.length : 0} bytes`);
    
    if (response.data) {
      const hasResults = response.data.includes('/url?q=');
      console.log(`  Search results present: ${hasResults ? '✓ YES' : '✗ NO'}`);
      
      if (response.status === 429) {
        console.log(`  ⚠️ Got rate limited (429) - too many requests`);
      } else if (response.status === 503) {
        console.log(`  ⚠️ Got service unavailable (503) - server overloaded`);
      }
    }
  } catch (err) {
    console.log(`✗ Google Search request failed: ${err.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log('  - If Test 1 fails: Network DNS resolution issue');
  console.log('  - If Test 2 fails: Firewall blocking proxy access');
  console.log('  - If Test 4-5 fail: Credentials or proxy service issue');
  console.log('  - If all pass: Issue is with Puppeteer proxy integration');
}

testProxyConnectivity().catch(console.error);
