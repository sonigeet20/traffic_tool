#!/bin/bash
set -e

PROJECT_ID="xrqobmncpllhkjjorjul"
SUPABASE_URL="https://xrqobmncpllhkjjorjul.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycW9ibW5jcGxsaGtqam9yanVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTE5MTQzOSwiZXhwIjoyMDgwNzY3NDM5fQ.tNlx3BrS7J_7nmr_OaR6Ixeeao9M7EBrzpgxPwP4vQA"

echo "🚀 Deploying Edge Functions to staging Supabase..."

# Try deploying with yes flag for confirmation
echo "y" | npx supabase@latest functions deploy campaign-scheduler --project-id "$PROJECT_ID" || {
  echo "⚠️ If deploy fails, you can manually deploy via:"
  echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_ID/functions"
  echo "2. Click 'Create a new function'"
  echo "3. Name: campaign-scheduler"
  echo "4. Copy paste content from: supabase/functions/campaign-scheduler/index.ts"
  echo "5. Update the puppeteerServerUrl to: http://localhost:3000"
  exit 1
}

echo "✅ Deployment complete!"
