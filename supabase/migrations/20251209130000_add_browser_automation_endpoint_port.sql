-- Add endpoint and port fields for Browser Automation configuration
ALTER TABLE bright_data_serp_config 
ADD COLUMN IF NOT EXISTS browser_endpoint text DEFAULT 'brd.superproxy.io',
ADD COLUMN IF NOT EXISTS browser_port text DEFAULT '9222';

-- Add comments for documentation
COMMENT ON COLUMN bright_data_serp_config.browser_endpoint IS 'WebSocket endpoint for Bright Data Browser Automation (default: brd.superproxy.io)';
COMMENT ON COLUMN bright_data_serp_config.browser_port IS 'WebSocket port for Bright Data Browser Automation (default: 9222)';
