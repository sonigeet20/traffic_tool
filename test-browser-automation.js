#!/usr/bin/env node
/**
 * Direct test for Bright Data Browser Automation API
 * Based on official Bright Data documentation
 * 
 * Usage: node test-browser-automation.cjs "wss://brd-customer-hl_xxxxx-zone-scraping_browser1:PASSWORD@brd.superproxy.io:9222"
 */

import puppeteerCore from 'puppeteer-core';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testBrowserAutomation(browserWSEndpoint) {
  if (!browserWSEndpoint) {
    console.error('❌ No WebSocket endpoint provided');
    console.error('Usage: node test-browser-automation.js "wss://brd-customer-hl_xxxxx:password@brd.superproxy.io:9222"');
    console.error('\nExample:');
    console.error('node test-browser-automation.js "wss://brd-customer-hl_a908b07a-zone-unblocker:dw6x0q7oe6ix@brd.superproxy.io:9222"');
    process.exit(1);
  }

  console.log('\n🔍 Testing Bright Data Browser Automation API');
  console.log('═'.repeat(60));
  
  // Parse endpoint for display
  const match = browserWSEndpoint.match(/wss:\/\/(brd-customer-[^-]+)-zone-([^:]+):([^@]+)@/);
  if (match) {
    console.log(`📋 Endpoint Details:`);
    console.log(`   Customer: ${match[1]}`);
    console.log(`   Zone: ${match[2]}`);
    console.log(`   Has Password: ${match[3] ? '✓' : '✗'}`);
  }
  
  console.log(`\n⏳ Connecting to: ${browserWSEndpoint.substring(0, 60)}...`);
  
  let browser;
  try {
    browser = await puppeteerCore.connect({
      browserWSEndpoint: browserWSEndpoint,
      ignoreHTTPSErrors: true,
      timeout: 60000,
    });
    
    console.log('✅ Successfully connected to Bright Data Browser Automation API!');
    console.log('');
    console.log('Testing browser functionality...');
    
    const page = await browser.newPage();
    console.log('✅ Created new page');
    
    // Test CDP session (like in official example)
    const client = await page.createCDPSession();
    console.log('✅ Created CDP session');
    
    // Get frame info
    const { frameTree: { frame } } = await client.send('Page.getFrameTree');
    console.log('✅ Retrieved frame tree');
    
    // Get inspection URL (like in official example)
    const { url: inspectUrl } = await client.send('Page.inspect', {
      frameId: frame.id,
    });
    console.log(`✅ Inspect URL: ${inspectUrl}`);
    
    // Navigate to test site
    console.log('\n⏳ Navigating to https://example.com...');
    await page.goto('https://example.com', { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('✅ Successfully navigated to https://example.com');
    
    // Get page title
    const title = await page.title();
    console.log(`✅ Page title: "${title}"`);
    
    // Get first paragraph
    const firstParagraph = await page.$eval('p', el => el.innerText).catch(() => null);
    if (firstParagraph) {
      console.log(`✅ First paragraph: "${firstParagraph.substring(0, 100)}..."`);
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 All tests passed! Browser Automation is working correctly.');
    console.log('═'.repeat(60) + '\n');
    
    await browser.close();
    return true;
    
  } catch (error) {
    console.error('\n❌ Error: ' + error.message);
    
    if (error.message.includes('403') || error.message.includes('Unauthorized')) {
      console.error('\n🔧 Troubleshooting 403 Unauthorized:');
      console.error('');
      console.error('1️⃣  Verify credentials in Bright Data dashboard:');
      console.error('   - Go to https://brightdata.com');
      console.error('   - Find "Browser Automation" or "Scraping Browser"');
      console.error('   - Copy the FULL WebSocket URL');
      console.error('');
      console.error('2️⃣  Check zone availability:');
      console.error('   - Try zone "unblocker" instead of "scraping_browser1"');
      console.error('   - Example: wss://brd-customer-hl_a908b07a-zone-unblocker:PASSWORD@...');
      console.error('');
      console.error('3️⃣  Verify exact format:');
      console.error('   ✓ Protocol: wss:// (not http://)');
      console.error('   ✓ Prefix: brd-customer-');
      console.error('   ✓ Zone: -zone-{name}');
      console.error('   ✓ Port: :9222 (not 33335 or other)');
      console.error('   ✓ Host: @brd.superproxy.io');
      console.error('');
      console.error('4️⃣  Try this test with updated credentials:');
      console.error(`   node test-browser-automation.js "wss://brd-customer-hl_a908b07a-zone-unblocker:YOUR_PASSWORD@brd.superproxy.io:9222"`);
      console.error('');
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.error('\n🔧 Troubleshooting connection timeout:');
      console.error('1. Verify internet connection');
      console.error('2. Check if brd.superproxy.io is accessible');
      console.error('3. Verify credentials are correct');
      console.error('4. Try in 1 minute (might be rate limited)');
    }
    
    console.error('\n' + '═'.repeat(60) + '\n');
    
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
    
    return false;
  }
}

// Run test
const endpoint = process.argv[2];
testBrowserAutomation(endpoint).then(success => {
  process.exit(success ? 0 : 1);
});
