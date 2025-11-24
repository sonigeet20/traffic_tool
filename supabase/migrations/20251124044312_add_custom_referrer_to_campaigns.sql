/*
  # Add custom referrer override to campaigns

  1. Changes
    - Add `custom_referrer` column to campaigns table
    - Allows hard-setting the referrer for all traffic regardless of source
    - Helps ensure Google Analytics registers organic search traffic correctly

  2. Purpose
    - Override the referrer header sent to target site
    - Force GA to recognize traffic as coming from specific source (e.g., google.com)
    - Useful when Google search clicks aren't properly setting referrer
*/

-- Add custom referrer field to campaigns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'custom_referrer'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN custom_referrer text;
    COMMENT ON COLUMN campaigns.custom_referrer IS 'Custom referrer URL to override for all traffic (e.g., https://www.google.com/)';
  END IF;
END $$;