-- Add site_structure JSON column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS site_structure JSONB;

-- Add index for site structure queries
CREATE INDEX IF NOT EXISTS idx_campaigns_site_structure ON campaigns USING GIN (site_structure);

-- Add trace_timestamp to track when structure was analyzed
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS site_structure_traced_at TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN campaigns.site_structure IS 'Pre-mapped website structure including navigable pages, forms, content areas, and internal links';
COMMENT ON COLUMN campaigns.site_structure_traced_at IS 'Timestamp when website structure was analyzed';
