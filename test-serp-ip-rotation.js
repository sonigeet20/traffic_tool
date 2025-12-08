/**
 * Test script to verify SERP API IP rotation and geo-targeting
 * Tests multiple requests with different geo locations
 */

const PUPPETEER_SERVER = 'http://13.218.100.97:3000';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Test configurations
const testConfigs = [
  { geo: 'US', keyword: 'groeixyz.com', country: 'United States' },
  { geo: 'GB', keyword: 'groeixyz.com', country: 'United Kingdom' },
  { geo: 'DE', keyword: 'groeixyz.com', country: 'Germany' },
  { geo: 'CA', keyword: 'groeixyz.com', country: 'Canada' },
  { geo: 'AU', keyword: 'groeixyz.com', country: 'Australia' }
];

async function testSerpApiRequest(config, testNum) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test ${testNum}: ${config.country} (${config.geo})`);
  console.log('='.repeat(60));

  const sessionId = `test-${config.geo.toLowerCase()}-${Date.now()}`;

  const payload = {
    url: 'https://groeixyz.com',
    searchKeyword: config.keyword,
    geoLocation: config.geo,
    useSerpApi: true,
    serpApiProvider: 'bright_data',
    sessionId: sessionId,
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_KEY,
    userId: '14be5d90-4d47-4df8-be64-e18a2c02fe75', // Replace with actual user ID
    actions: [{ type: 'wait', duration: 5000 }],
    waitUntil: 'networkidle2'
  };

  console.log(`📤 Sending request...`);
  console.log(`   Session ID: ${sessionId}`);
  console.log(`   Keyword: ${config.keyword}`);
  console.log(`   Geo: ${config.geo} (${config.country})`);

  try {
    const response = await fetch(`${PUPPETEER_SERVER}/api/automate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.log(`❌ Request failed with status: ${response.status}`);
      const text = await response.text();
      console.log(`   Error: ${text}`);
      return null;
    }

    console.log(`✅ Request sent successfully`);
    console.log(`⏳ Waiting 30 seconds for session to complete...`);

    // Wait for the session to complete
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Query the database for IP tracking
    const ipQuery = await fetch(
      `${SUPABASE_URL}/rest/v1/session_ip_tracking?session_id=eq.${sessionId}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const ipData = await ipQuery.json();

    if (ipData && ipData.length > 0) {
      const ip = ipData[0];
      console.log(`\n📊 IP Tracking Results:`);
      console.log(`   IP Address: ${ip.ip_address}`);
      console.log(`   Country Code: ${ip.country_code}`);
      console.log(`   Expected: ${config.geo}`);
      console.log(`   Match: ${ip.country_code === config.geo ? '✅ YES' : '❌ NO'}`);
      return {
        sessionId,
        ip: ip.ip_address,
        country: ip.country_code,
        geo: config.geo,
        match: ip.country_code === config.geo
      };
    } else {
      console.log(`\n⚠️  No IP tracking data found for session ${sessionId}`);
      console.log(`   This could mean:`);
      console.log(`   1. IP detection failed`);
      console.log(`   2. Session hasn't completed yet`);
      console.log(`   3. Database insert failed`);
      return null;
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('\n🧪 SERP API IP Rotation Test');
  console.log('Testing IP rotation and geo-targeting across multiple locations\n');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const results = [];

  for (let i = 0; i < testConfigs.length; i++) {
    const result = await testSerpApiRequest(testConfigs[i], i + 1);
    if (result) {
      results.push(result);
    }

    // Wait between tests
    if (i < testConfigs.length - 1) {
      console.log(`\n⏸️  Waiting 10 seconds before next test...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📈 TEST SUMMARY');
  console.log('='.repeat(60));

  if (results.length === 0) {
    console.log('❌ No successful tests');
    return;
  }

  console.log(`\nTotal Tests: ${testConfigs.length}`);
  console.log(`Successful: ${results.length}`);
  console.log(`Failed: ${testConfigs.length - results.length}\n`);

  // Check for unique IPs
  const uniqueIPs = new Set(results.map(r => r.ip));
  console.log(`Unique IP Addresses: ${uniqueIPs.size}`);
  console.log(`IP Rotation: ${uniqueIPs.size === results.length ? '✅ WORKING' : '⚠️ POSSIBLE ISSUE'}\n`);

  // List all IPs
  console.log('IP Addresses Detected:');
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.ip} (${r.country}) - Requested: ${r.geo} ${r.match ? '✅' : '❌'}`);
  });

  // Check geo-targeting accuracy
  const geoMatches = results.filter(r => r.match).length;
  const geoAccuracy = (geoMatches / results.length * 100).toFixed(1);
  console.log(`\nGeo-Targeting Accuracy: ${geoAccuracy}% (${geoMatches}/${results.length})`);

  if (uniqueIPs.size === results.length && geoAccuracy === '100.0') {
    console.log('\n✅ All tests passed! IP rotation and geo-targeting working correctly.');
  } else if (uniqueIPs.size < results.length) {
    console.log('\n⚠️  IP rotation may not be working - same IPs detected across requests');
  } else if (geoAccuracy < 100) {
    console.log('\n⚠️  Geo-targeting accuracy is below 100%');
  }
}

runTests().catch(console.error);
