-- Check Google search click behavior after test run
-- Run this query after starting a test campaign

-- 1. Recent search sessions with clicked URLs
SELECT
  id,
  search_keyword,
  google_search_clicked_url,
  google_search_attempted,
  google_search_completed,
  google_search_result_clicked,
  status,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
FROM bot_sessions
WHERE traffic_source = 'search'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Summary statistics
SELECT
  COUNT(*) as total_search_sessions,
  COUNT(CASE WHEN google_search_attempted = true THEN 1 END) as attempted,
  COUNT(CASE WHEN google_search_completed = true THEN 1 END) as completed,
  COUNT(CASE WHEN google_search_result_clicked = true THEN 1 END) as clicked,
  COUNT(CASE WHEN google_search_clicked_url IS NOT NULL AND google_search_clicked_url != 'NOT_FOUND_IN_RESULTS' THEN 1 END) as found_and_clicked,
  COUNT(CASE WHEN google_search_clicked_url = 'NOT_FOUND_IN_RESULTS' THEN 1 END) as not_found,
  COUNT(CASE WHEN google_search_clicked_url IS NULL THEN 1 END) as no_url_data
FROM bot_sessions
WHERE traffic_source = 'search';

-- 3. Group by clicked URLs (see what domains are being clicked)
SELECT
  google_search_clicked_url,
  COUNT(*) as click_count,
  array_agg(DISTINCT search_keyword) as keywords_used
FROM bot_sessions
WHERE traffic_source = 'search'
  AND google_search_clicked_url IS NOT NULL
GROUP BY google_search_clicked_url
ORDER BY click_count DESC;

-- 4. Check if custom referrer is being tracked (via any session tracking)
SELECT
  id,
  traffic_source,
  referrer,
  google_search_clicked_url,
  status
FROM bot_sessions
WHERE traffic_source = 'search'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Success rate by keyword
SELECT
  search_keyword,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN google_search_result_clicked = true THEN 1 END) as successful_clicks,
  ROUND(COUNT(CASE WHEN google_search_result_clicked = true THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as success_rate_pct
FROM bot_sessions
WHERE traffic_source = 'search'
  AND search_keyword IS NOT NULL
GROUP BY search_keyword
ORDER BY total_attempts DESC;
