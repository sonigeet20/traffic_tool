-- Add complete Browser API configuration fields to bright_data_serp_config
ALTER TABLE bright_data_serp_config 
ADD COLUMN IF NOT EXISTS browser_customer_id text,
ADD COLUMN IF NOT EXISTS browser_endpoint text DEFAULT 'brd.superproxy.io',
ADD COLUMN IF NOT EXISTS browser_port text DEFAULT '9222',
ADD COLUMN IF NOT EXISTS browser_zone text;

COMMENT ON COLUMN bright_data_serp_config.browser_customer_id IS 
  'Bright Data customer ID (e.g., hl_a908b07a)';
  
COMMENT ON COLUMN bright_data_serp_config.browser_endpoint IS 
  'Browser API endpoint (default: brd.superproxy.io)';
  
COMMENT ON COLUMN bright_data_serp_config.browser_port IS 
  'Browser API port (default: 9222 for WebSocket)';

COMMENT ON COLUMN bright_data_serp_config.browser_zone IS 
  'Browser API zone name (e.g., scraping_browser1, unblocker)';
