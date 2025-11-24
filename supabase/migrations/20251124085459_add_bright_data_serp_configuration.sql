/*
  # Add Bright Data SERP API Configuration

  1. New Tables
    - `bright_data_serp_config`
      - `id` (uuid, primary key)
      - `user_id` (uuid, unique) - one config per user
      - `api_token` (text) - Bright Data API token
      - `customer_id` (text) - Bright Data customer ID
      - `zone_name` (text) - Zone/proxy zone name
      - `enabled` (boolean) - whether SERP API is enabled
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to campaigns table
    - Add `use_serp_api` (boolean) - whether to use SERP API for this campaign
    - Add `serp_api_provider` (text) - which SERP provider (bright_data, oxylabs, etc.)
    - Defaults to false and regular proxies

  3. Security
    - Enable RLS on `bright_data_serp_config` table
    - Users can only read/update their own configuration
*/

-- Create Bright Data SERP config table
CREATE TABLE IF NOT EXISTS bright_data_serp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  api_token text,
  customer_id text,
  zone_name text DEFAULT 'serp',
  enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE bright_data_serp_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own SERP config"
  ON bright_data_serp_config FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SERP config"
  ON bright_data_serp_config FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own SERP config"
  ON bright_data_serp_config FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own SERP config"
  ON bright_data_serp_config FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add columns to campaigns table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'use_serp_api'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN use_serp_api boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'serp_api_provider'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN serp_api_provider text DEFAULT 'bright_data';
  END IF;
END $$;

-- Add helpful comment
COMMENT ON COLUMN campaigns.use_serp_api IS 'Whether to use SERP API (e.g., Bright Data SERP) instead of regular proxies for Google searches';
COMMENT ON COLUMN campaigns.serp_api_provider IS 'SERP API provider to use: bright_data, oxylabs, smartproxy, etc.';
COMMENT ON TABLE bright_data_serp_config IS 'Configuration for Bright Data SERP API integration';
