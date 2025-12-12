const fs = require('fs');
const path = require('path');

// Read function files
const campaignSchedulerCode = fs.readFileSync(
  path.join(__dirname, 'supabase/functions/campaign-scheduler/index.ts'),
  'utf-8'
);
const startCampaignCode = fs.readFileSync(
  path.join(__dirname, 'supabase/functions/start-campaign/index.ts'),
  'utf-8'
);
const updateSessionCode = fs.readFileSync(
  path.join(__dirname, 'supabase/functions/update-session-tracking/index.ts'),
  'utf-8'
);

const supabaseUrl = 'https://xrqobmncpllhkjjorjul.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycW9ibW5jcGxsaGtqam9yanVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTE5MTQzOSwiZXhwIjoyMDgwNzY3NDM5fQ.tNlx3BrS7J_7nmr_OaR6Ixeeao9M7EBrzpgxPwP4vQA';

const functions = [
  {
    name: 'campaign-scheduler',
    code: campaignSchedulerCode,
    entryPoint: 'index'
  },
  {
    name: 'start-campaign',
    code: startCampaignCode,
    entryPoint: 'index'
  },
  {
    name: 'update-session-tracking',
    code: updateSessionCode,
    entryPoint: 'index'
  }
];

async function deployFunction(functionName, code) {
  try {
    console.log(`\nDeploying function: ${functionName}...`);
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/octet-stream',
        },
        body: code,
      }
    );

    const responseText = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${responseText}`);

    if (!response.ok) {
      console.error(`Failed to deploy ${functionName}`);
      return false;
    }

    console.log(`✓ ${functionName} deployed successfully`);
    return true;
  } catch (error) {
    console.error(`Error deploying ${functionName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Starting Edge Function deployment...');
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  let successCount = 0;
  for (const func of functions) {
    if (await deployFunction(func.name, func.code)) {
      successCount++;
    }
  }

  console.log(`\n✓ Deployment complete: ${successCount}/${functions.length} functions deployed`);
}

main().catch(console.error);
