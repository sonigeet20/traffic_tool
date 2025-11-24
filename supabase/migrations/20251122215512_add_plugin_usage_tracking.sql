/*
  # Add Plugin Usage Tracking to Sessions

  1. New Columns
    - `plugin_loaded` (boolean) - Whether the Chrome extension was successfully loaded
    - `plugin_active` (boolean) - Whether the plugin executed/was active during session
    - `plugin_load_timestamp` (timestamptz) - When the plugin was loaded
    - `plugin_extension_id` (text) - The Chrome extension ID that was used

  2. Purpose
    - Verify that Chrome extensions are being loaded correctly
    - Track which sessions had plugin support
    - Debug plugin loading issues
    - Ensure plugins are functioning during sessions

  3. Notes
    - These fields apply to sessions that have a plugin configured
    - Sessions without plugins will have these fields as NULL/false
    - Helps verify the extension automation is working correctly
*/

-- Add tracking columns for plugin/extension verification
ALTER TABLE bot_sessions 
  ADD COLUMN IF NOT EXISTS plugin_loaded boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS plugin_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS plugin_load_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS plugin_extension_id text;

-- Add comments for clarity
COMMENT ON COLUMN bot_sessions.plugin_loaded IS 'Whether a Chrome extension was successfully loaded in the browser';
COMMENT ON COLUMN bot_sessions.plugin_active IS 'Whether the plugin was active/executed during the session';
COMMENT ON COLUMN bot_sessions.plugin_load_timestamp IS 'Timestamp when the plugin was loaded';
COMMENT ON COLUMN bot_sessions.plugin_extension_id IS 'The Chrome Web Store extension ID that was used';

-- Create an index for querying plugin usage
CREATE INDEX IF NOT EXISTS idx_sessions_plugin_tracking 
  ON bot_sessions(plugin_loaded, plugin_active, plugin_extension_id);