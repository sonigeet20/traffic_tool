-- Query to check Google search click behavior
-- Run this after starting a campaign to see what URLs are being clicked

SELECT
  id,
  traffic_source,
  search_keyword,
  google_search_attempted,
  google_search_completed,
  google_search_result_clicked,
  google_search_clicked_url,
  status,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
FROM bot_sessions
WHERE traffic_source = 'search'
ORDER BY created_at DESC
LIMIT 20;

-- Summary of search sessions
SELECT
  COUNT(*) as total_search_sessions,
  COUNT(CASE WHEN google_search_attempted = true THEN 1 END) as attempted,
  COUNT(CASE WHEN google_search_completed = true THEN 1 END) as completed,
  COUNT(CASE WHEN google_search_result_clicked = true THEN 1 END) as clicked,
  COUNT(CASE WHEN google_search_clicked_url IS NOT NULL THEN 1 END) as with_url,
  COUNT(CASE WHEN google_search_clicked_url = 'NOT_FOUND_IN_RESULTS' THEN 1 END) as not_found
FROM bot_sessions
WHERE traffic_source = 'search';
