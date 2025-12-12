#!/usr/bin/env node
/**
 * Quick test for Bright Data Browser Automation credentials
 * 
 * Usage: node test-browser-auth.cjs "wss://brd-customer-hl_xxxxx-zone-name:password@brd.superproxy.io:9222"
 */

const puppeteer = require('puppeteer-core');

async function testConnection(endpoint) {
  if (!endpoint) {
    console.log('\n❌ No endpoint provided\n');
    console.log('Usage: node test-browser-auth.cjs "wss://brd-customer-hl_xxxxx-zone-name:password@brd.superproxy.io:9222"\n');
    process.exit(1);
  }

  console.log('\n🔍 Testing Bright Data Browser Automation\n');
  
  // Parse endpoint
  const match = endpoint.match(/wss:\/\/(brd-customer-[^-]+)-zone-([^:]+):([^@]+)@/);
  if (match) {
    console.log('📋 Parsed Endpoint:');
    console.log(`   Customer ID: ${match[1]}`);
    console.log(`   Zone: ${match[2]}`);
    console.log(`   Has Password: ${match[3] ? '✓ yes' : '✗ no'}\n`);
  }

  console.log(`⏳ Connecting to Bright Data...\n`);

  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: endpoint,
      ignoreHTTPSErrors: true,
      timeout: 30000,
    });

    console.log('✅ SUCCESS! Connected to Bright Data Browser Automation API\n');
    console.log('Your credentials are valid and working.\n');
    
    await browser.close();
    return true;

  } catch (error) {
    console.log(`❌ FAILED: ${error.message}\n`);

    if (error.message.includes('403')) {
      console.log('🔧 403 Unauthorized - Credential Issue\n');
      console.log('Solutions:');
      console.log('1. Verify zone name in Bright Data dashboard');
      console.log('   - Try: -zone-unblocker instead of -zone-scraping_browser1');
      console.log('2. Copy FULL endpoint from Bright Data dashboard');
      console.log('3. Verify customer ID (hl_xxxxx) is correct');
      console.log('4. Ensure port is 9222 (not 33335 or other)\n');
      console.log('Command to retry with unblocker zone:');
      const newEndpoint = endpoint.replace('-zone-scraping_browser1', '-zone-unblocker');
      console.log(`node test-browser-auth.cjs "${newEndpoint}"\n`);
    }

    return false;
  }
}

const endpoint = process.argv[2];
testConnection(endpoint).then(success => {
  process.exit(success ? 0 : 1);
});
