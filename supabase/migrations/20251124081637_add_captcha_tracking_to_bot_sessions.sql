/*
  # Add CAPTCHA tracking to bot_sessions

  1. Changes
    - Add `google_captcha_encountered` boolean column to track when Google shows CAPTCHA
    - Defaults to false
    - Helps identify problematic proxies that get flagged by Google
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_sessions' AND column_name = 'google_captcha_encountered'
  ) THEN
    ALTER TABLE bot_sessions ADD COLUMN google_captcha_encountered boolean DEFAULT false;
  END IF;
END $$;
