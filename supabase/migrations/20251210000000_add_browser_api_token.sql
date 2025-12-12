-- Add API token field for Bright Data HTTP API
-- This is different from browser_password (WebSocket auth)
-- API token is a 64-char hex string used with Bearer authentication

ALTER TABLE bright_data_serp_config 
ADD COLUMN IF NOT EXISTS browser_api_token text;

COMMENT ON COLUMN bright_data_serp_config.browser_api_token IS 
  'API token for Bright Data HTTP API (64-char hex). Used as Bearer token for api.brightdata.com/request endpoint.';
