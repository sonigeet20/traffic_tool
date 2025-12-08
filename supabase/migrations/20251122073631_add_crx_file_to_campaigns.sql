/*
  # Add CRX File Support to Campaigns

  1. Changes
    - Add `extension_crx_url` column to campaigns table
      - Stores the Supabase Storage URL for uploaded CRX files
      - Nullable (extensions are optional)
    
  2. Notes
    - CRX files will be uploaded to Supabase Storage
    - The URL will be stored in this column
    - Puppeteer will download and load the extension at runtime
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'extension_crx_url'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN extension_crx_url text;
  END IF;
END $$;