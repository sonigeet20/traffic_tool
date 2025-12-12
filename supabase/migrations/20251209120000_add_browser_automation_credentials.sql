-- Add separate Browser Automation credentials to bright_data_serp_config
ALTER TABLE bright_data_serp_config 
ADD COLUMN IF NOT EXISTS browser_username text,
ADD COLUMN IF NOT EXISTS browser_password text;

COMMENT ON COLUMN bright_data_serp_config.browser_username IS 
  'Full Browser Automation username (e.g., brd-customer-hl_a908b07a-zone-unblocker)';
  
COMMENT ON COLUMN bright_data_serp_config.browser_password IS 
  'Password for Browser Automation zone';
