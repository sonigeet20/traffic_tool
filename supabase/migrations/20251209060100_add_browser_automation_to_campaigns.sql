/*
  # Add Browser Automation toggle to campaigns

  1. Changes
    - Add use_browser_automation column to campaigns table
    - Allows per-campaign override of Browser Automation setting
    - When null, inherits from bright_data_serp_config.use_browser_automation
    - When set, overrides user-level setting for this specific campaign
*/

-- Add Browser Automation toggle to campaigns
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS use_browser_automation boolean DEFAULT NULL;

COMMENT ON COLUMN campaigns.use_browser_automation IS 
'Per-campaign Browser Automation toggle. NULL = inherit from user config, true/false = override for this campaign.';
