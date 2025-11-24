/*
  # Add Google Search Tracking to Sessions

  1. New Columns
    - `google_search_attempted` (boolean) - Whether the session attempted a Google search
    - `google_search_completed` (boolean) - Whether Google search was successfully completed
    - `google_search_result_clicked` (boolean) - Whether a search result was clicked
    - `google_search_timestamp` (timestamptz) - When Google search page was loaded
    - `target_site_reached_timestamp` (timestamptz) - When target site was reached from Google

  2. Purpose
    - Track the entire Google search funnel
    - Verify sessions are actually going through Google
    - Measure success rate of Google search traffic
    - Debug any issues with search automation

  3. Notes
    - These fields only apply to sessions with traffic_source = 'search'
    - Direct traffic sessions will have all these fields as NULL
    - Helps verify the search automation is working correctly
*/

-- Add tracking columns for Google search verification
ALTER TABLE bot_sessions 
  ADD COLUMN IF NOT EXISTS google_search_attempted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_search_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_search_result_clicked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_search_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS target_site_reached_timestamp timestamptz;

-- Add comments for clarity
COMMENT ON COLUMN bot_sessions.google_search_attempted IS 'Whether the session attempted to perform a Google search';
COMMENT ON COLUMN bot_sessions.google_search_completed IS 'Whether the Google search was successfully executed and results loaded';
COMMENT ON COLUMN bot_sessions.google_search_result_clicked IS 'Whether a search result link was successfully clicked';
COMMENT ON COLUMN bot_sessions.google_search_timestamp IS 'Timestamp when Google search page was loaded';
COMMENT ON COLUMN bot_sessions.target_site_reached_timestamp IS 'Timestamp when target site was reached from search results';

-- Create an index for querying search performance
CREATE INDEX IF NOT EXISTS idx_sessions_google_tracking 
  ON bot_sessions(traffic_source, google_search_attempted, google_search_completed, google_search_result_clicked);