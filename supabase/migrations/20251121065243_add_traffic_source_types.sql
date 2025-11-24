/*
  # Add Traffic Source Types to Campaigns

  1. Changes to campaigns table
    - Add `traffic_source_distribution` (jsonb) - distribution of traffic sources
      Example: {"direct": 50, "search": 50} means 50% direct, 50% from search
    - Add `search_keywords` (jsonb array) - keywords to use for Google search
      Example: ["brand name", "product category keyword"]

  2. Changes to bot_sessions table
    - Add `traffic_source` (text) - 'direct' or 'search'
    - Add `search_keyword` (text) - keyword used if traffic_source is 'search'
    - Add `referrer` (text) - referrer URL (Google search page for search traffic)

  3. Notes
    - Bots will either visit directly or search Google first then click result
    - Search traffic will have Google as referrer
    - Direct traffic will have no referrer
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'traffic_source_distribution'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN traffic_source_distribution jsonb DEFAULT '{"direct": 50, "search": 50}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'search_keywords'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN search_keywords jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_sessions' AND column_name = 'traffic_source'
  ) THEN
    ALTER TABLE bot_sessions ADD COLUMN traffic_source text DEFAULT 'direct';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_sessions' AND column_name = 'search_keyword'
  ) THEN
    ALTER TABLE bot_sessions ADD COLUMN search_keyword text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_sessions' AND column_name = 'referrer'
  ) THEN
    ALTER TABLE bot_sessions ADD COLUMN referrer text;
  END IF;
END $$;