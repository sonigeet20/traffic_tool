/*
  # Add Bright Data Browser Automation API Support

  1. Changes to bright_data_serp_config table
    - Add `use_browser_automation` (boolean) - Toggle between SERP API (dual-proxy) vs Browser Automation (single proxy)
    - Add `browser_zone` (text) - Browser Automation zone name (e.g., 'unblocker', 'scraping_browser')
    
  2. How it works
    - When use_browser_automation = false: Uses existing SERP API + Luna dual-proxy flow
    - When use_browser_automation = true: Connects to Bright Data's browser via WebSocket, single proxy for entire session
    
  3. Browser Automation WebSocket Format
    wss://brd-customer-{CUSTOMER_ID}-zone-{ZONE}-country-{COUNTRY}:{PASSWORD}@brd.superproxy.io:9222
*/

-- Add Browser Automation toggle
ALTER TABLE bright_data_serp_config 
ADD COLUMN IF NOT EXISTS use_browser_automation boolean DEFAULT false;

-- Add Browser Automation zone (separate from SERP zone)
ALTER TABLE bright_data_serp_config 
ADD COLUMN IF NOT EXISTS browser_zone text DEFAULT 'unblocker';

-- Add comment explaining the difference
COMMENT ON COLUMN bright_data_serp_config.use_browser_automation IS 
'When true, uses Browser Automation API (single WebSocket proxy). When false, uses SERP API + Luna dual-proxy.';

COMMENT ON COLUMN bright_data_serp_config.browser_zone IS 
'Browser Automation zone name. Common values: unblocker, scraping_browser, residential';

COMMENT ON COLUMN bright_data_serp_config.zone_name IS 
'SERP API zone name (used when use_browser_automation = false). Common values: serp, serp_api1';
