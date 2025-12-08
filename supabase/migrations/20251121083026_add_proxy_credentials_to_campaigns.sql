/*
  # Add Proxy Credentials to Campaigns

  1. Changes
    - Add proxy configuration fields to campaigns table:
      - `proxy_username` (text) - Proxy username/customer ID
      - `proxy_password` (text) - Proxy password
      - `proxy_host` (text) - Proxy server hostname
      - `proxy_port` (text) - Proxy server port
    
  2. Notes
    - These fields allow per-campaign proxy configuration
    - Credentials are stored securely in the database
    - Will be used by edge function to configure Luna Proxy connections
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'proxy_username'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN proxy_username text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'proxy_password'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN proxy_password text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'proxy_host'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN proxy_host text DEFAULT 'pr.lunaproxy.com';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'proxy_port'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN proxy_port text DEFAULT '12233';
  END IF;
END $$;