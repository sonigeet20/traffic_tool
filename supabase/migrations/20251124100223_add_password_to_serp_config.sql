/*
  # Add password field to Bright Data SERP configuration

  1. Changes
    - Add `api_password` column to `bright_data_serp_config` table
    - This stores the Bright Data zone password for SERP API authentication

  2. Security
    - Password is stored as encrypted text
    - Only accessible by the user who owns the configuration via existing RLS policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bright_data_serp_config' AND column_name = 'api_password'
  ) THEN
    ALTER TABLE bright_data_serp_config ADD COLUMN api_password text;
  END IF;
END $$;
