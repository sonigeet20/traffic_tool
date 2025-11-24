-- Run this query after deploying the fix to verify sessions are completing

-- Check recent session status distribution
SELECT
  status,
  COUNT(*) as count,
  ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))), 2) as avg_duration_seconds
FROM bot_sessions
WHERE created_at > NOW() - INTERVAL '15 minutes'
GROUP BY status
ORDER BY status;

-- Check last 10 sessions with details
SELECT
  id,
  status,
  started_at,
  completed_at,
  is_bounced,
  bounce_duration_ms,
  EXTRACT(EPOCH FROM (completed_at - started_at)) as actual_duration_seconds,
  error_message
FROM bot_sessions
ORDER BY created_at DESC
LIMIT 10;

-- Check completion rate
SELECT
  ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as completion_rate_percent,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
  COUNT(CASE WHEN status = 'running' THEN 1 END) as running_count,
  COUNT(*) as total_sessions
FROM bot_sessions
WHERE created_at > NOW() - INTERVAL '30 minutes';
