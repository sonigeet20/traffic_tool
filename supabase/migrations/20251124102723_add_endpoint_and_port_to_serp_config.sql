/*
  # Add endpoint and port fields to SERP configuration

  1. Changes to bright_data_serp_config table
    - Add `endpoint` (text) - SERP API endpoint hostname (e.g., brd.superproxy.io)
    - Add `port` (text) - SERP API port (e.g., 33335)
    - Set default values for backward compatibility

  2. Notes
    - Allows users to configure custom endpoints and ports for different SERP providers
    - Defaults to Bright Data SERP API values
    - Ensures flexibility for future SERP API providers
*/

-- Add endpoint and port columns to bright_data_serp_config
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bright_data_serp_config' AND column_name = 'endpoint'
  ) THEN
    ALTER TABLE bright_data_serp_config ADD COLUMN endpoint text DEFAULT 'brd.superproxy.io';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bright_data_serp_config' AND column_name = 'port'
  ) THEN
    ALTER TABLE bright_data_serp_config ADD COLUMN port text DEFAULT '33335';
  END IF;
END $$;

-- Add helpful comments
COMMENT ON COLUMN bright_data_serp_config.endpoint IS 'SERP API endpoint hostname (e.g., brd.superproxy.io)';
COMMENT ON COLUMN bright_data_serp_config.port IS 'SERP API port number (e.g., 33335 for Bright Data SERP)';
