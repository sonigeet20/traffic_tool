// Test script to verify SERP API configuration
import fs from 'fs';

// Read .env file manually
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

async function testSerpConfig() {
  console.log('Testing SERP API Configuration...\n');

  // Check if we can access the bright_data_serp_config table
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/bright_data_serp_config?select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    });

    const configs = await response.json();
    console.log('SERP Configs found:', configs.length);

    if (configs.length > 0) {
      configs.forEach((config, idx) => {
        console.log(`\nConfig ${idx + 1}:`);
        console.log(`  User ID: ${config.user_id}`);
        console.log(`  Enabled: ${config.enabled}`);
        console.log(`  API Token: ${config.api_token ? config.api_token.substring(0, 30) + '...' : 'NOT SET'}`);
        console.log(`  Has Password: ${!!config.api_password}`);
        console.log(`  Customer ID: ${config.customer_id || 'NOT SET'}`);
        console.log(`  Zone Name: ${config.zone_name || 'NOT SET'}`);
        console.log(`  Endpoint: ${config.endpoint}`);
        console.log(`  Port: ${config.port}`);
      });
    } else {
      console.log('\n⚠️  No SERP configurations found!');
      console.log('Please configure SERP API in Settings → SERP Configuration');
    }

    // Check campaigns with SERP enabled
    const campaignsResponse = await fetch(`${supabaseUrl}/rest/v1/campaigns?select=id,name,use_serp_api,serp_api_provider&use_serp_api=eq.true`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    });

    const campaigns = await campaignsResponse.json();
    console.log(`\n\nCampaigns with SERP API enabled: ${campaigns.length}`);

    if (campaigns.length > 0) {
      campaigns.forEach(camp => {
        console.log(`  - ${camp.name} (${camp.serp_api_provider || 'bright_data'})`);
      });
    } else {
      console.log('  ℹ️  No campaigns have SERP API enabled');
      console.log('  Enable it in the campaign form under "SERP API Integration"');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSerpConfig();
