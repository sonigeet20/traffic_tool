/*
  # Add Geo Location, Proxy, and Distribution Settings to Campaigns

  1. Changes to campaigns table
    - Add `target_geo_locations` (jsonb array) - list of target countries/regions (e.g., ["US", "UK", "CA"])
    - Add `use_residential_proxies` (boolean) - whether to use residential proxies
    - Add `proxy_provider` (text) - proxy provider name/settings
    - Add `total_users` (integer) - total number of users/sessions to simulate
    - Add `distribution_period_hours` (integer) - time period in hours for user distribution
    - Add `distribution_pattern` (text) - pattern type: 'uniform', 'spike', 'gradual_increase', 'random'
    - Add `sessions_per_hour` (integer) - calculated field for distribution rate

  2. Notes
    - Geo locations stored as JSON array for flexibility
    - Distribution logic will be handled by edge function
    - Proxy settings for future integration with proxy providers
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'target_geo_locations'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN target_geo_locations jsonb DEFAULT '["US"]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'use_residential_proxies'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN use_residential_proxies boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'proxy_provider'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN proxy_provider text DEFAULT 'default';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'total_users'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN total_users integer DEFAULT 100;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'distribution_period_hours'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN distribution_period_hours integer DEFAULT 24;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'distribution_pattern'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN distribution_pattern text DEFAULT 'uniform';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'sessions_per_hour'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN sessions_per_hour numeric DEFAULT 4.17;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_sessions' AND column_name = 'geo_location'
  ) THEN
    ALTER TABLE bot_sessions ADD COLUMN geo_location text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_sessions' AND column_name = 'proxy_ip'
  ) THEN
    ALTER TABLE bot_sessions ADD COLUMN proxy_ip text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_sessions' AND column_name = 'proxy_type'
  ) THEN
    ALTER TABLE bot_sessions ADD COLUMN proxy_type text;
  END IF;
END $$;