#!/bin/bash

# Apply the browser_api_token migration to Supabase
# Run this script to add the new column to your database

echo "🔧 Applying browser_api_token migration..."
echo ""
echo "Copy the SQL below and run it in your Supabase SQL Editor:"
echo "https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat supabase/migrations/20251210000000_add_browser_api_token.sql
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "After running the SQL:"
echo "1. Go to SERP Config in your app"
echo "2. Check 'Enable Browser Automation'"
echo "3. Enter your API Token: cb3070be589695116882cfd8f6a37d4e3c0d19fe971d68b468ef4ab6d7437d1f"
echo "4. Click 'Save Browser Automation Config'"
echo "5. Test a search campaign"
echo ""
