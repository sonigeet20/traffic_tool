-- Adds a toggle to run Google search + click via Luna proxy for search traffic
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'use_luna_proxy_search'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN use_luna_proxy_search boolean DEFAULT false;
    COMMENT ON COLUMN campaigns.use_luna_proxy_search IS 'Force Google search via Luna proxy for search traffic when true';
  END IF;
END $$;
