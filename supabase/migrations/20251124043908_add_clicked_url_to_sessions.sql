/*
  # Add clicked URL tracking to bot sessions

  1. Changes
    - Add `google_search_clicked_url` column to store the exact URL clicked from Google search results
    - This helps verify the bot is clicking the correct domain and diagnose organic search tracking issues

  2. Purpose
    - Debug why Google Analytics shows all sessions as direct instead of organic search
    - Verify the correct URL is being clicked from search results
    - Ensure proper referrer tracking for GA
*/

-- Add column to store the URL clicked from Google search
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_sessions' AND column_name = 'google_search_clicked_url'
  ) THEN
    ALTER TABLE bot_sessions ADD COLUMN google_search_clicked_url text;
  END IF;
END $$;