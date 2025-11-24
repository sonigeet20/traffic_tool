export const setupDatabaseSQL = `
-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  target_url text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  total_sessions integer DEFAULT 0,
  concurrent_bots integer DEFAULT 1,
  session_duration_min integer DEFAULT 30,
  session_duration_max integer DEFAULT 300,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'campaigns' AND policyname = 'Users can view own campaigns'
  ) THEN
    CREATE POLICY "Users can view own campaigns"
      ON campaigns FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'campaigns' AND policyname = 'Users can create own campaigns'
  ) THEN
    CREATE POLICY "Users can create own campaigns"
      ON campaigns FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'campaigns' AND policyname = 'Users can update own campaigns'
  ) THEN
    CREATE POLICY "Users can update own campaigns"
      ON campaigns FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'campaigns' AND policyname = 'Users can delete own campaigns'
  ) THEN
    CREATE POLICY "Users can delete own campaigns"
      ON campaigns FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Create user_journeys table
CREATE TABLE IF NOT EXISTS user_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  step_order integer NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('navigate', 'click', 'scroll', 'wait', 'fill_form', 'hover', 'screenshot')),
  selector text,
  value text,
  wait_before integer DEFAULT 0,
  wait_after integer DEFAULT 1000,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_journeys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_journeys' AND policyname = 'Users can manage journeys of own campaigns'
  ) THEN
    CREATE POLICY "Users can manage journeys of own campaigns"
      ON user_journeys FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM campaigns
          WHERE campaigns.id = user_journeys.campaign_id
          AND campaigns.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM campaigns
          WHERE campaigns.id = user_journeys.campaign_id
          AND campaigns.user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_journeys_campaign_id ON user_journeys(campaign_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_step_order ON user_journeys(campaign_id, step_order);

-- Create bot_sessions table
CREATE TABLE IF NOT EXISTS bot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  user_agent text,
  viewport_width integer DEFAULT 1920,
  viewport_height integer DEFAULT 1080,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bot_sessions' AND policyname = 'Users can manage sessions of own campaigns'
  ) THEN
    CREATE POLICY "Users can manage sessions of own campaigns"
      ON bot_sessions FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM campaigns
          WHERE campaigns.id = bot_sessions.campaign_id
          AND campaigns.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM campaigns
          WHERE campaigns.id = bot_sessions.campaign_id
          AND campaigns.user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bot_sessions_campaign_id ON bot_sessions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_status ON bot_sessions(status);

-- Create session_activities table
CREATE TABLE IF NOT EXISTS session_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES bot_sessions(id) ON DELETE CASCADE NOT NULL,
  journey_step_id uuid REFERENCES user_journeys(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  element_selector text,
  success boolean DEFAULT true,
  duration_ms integer,
  screenshot_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_activities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'session_activities' AND policyname = 'Users can manage activities of own sessions'
  ) THEN
    CREATE POLICY "Users can manage activities of own sessions"
      ON session_activities FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM bot_sessions
          JOIN campaigns ON campaigns.id = bot_sessions.campaign_id
          WHERE bot_sessions.id = session_activities.session_id
          AND campaigns.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM bot_sessions
          JOIN campaigns ON campaigns.id = bot_sessions.campaign_id
          WHERE bot_sessions.id = session_activities.session_id
          AND campaigns.user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_session_activities_session_id ON session_activities(session_id);

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES bot_sessions(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  load_time_ms integer,
  dom_ready_ms integer,
  first_paint_ms integer,
  first_contentful_paint_ms integer,
  time_to_interactive_ms integer,
  total_requests integer,
  total_size_kb integer,
  memory_used_mb decimal,
  cpu_usage_percent decimal,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'performance_metrics' AND policyname = 'Users can manage metrics of own sessions'
  ) THEN
    CREATE POLICY "Users can manage metrics of own sessions"
      ON performance_metrics FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM bot_sessions
          JOIN campaigns ON campaigns.id = bot_sessions.campaign_id
          WHERE bot_sessions.id = performance_metrics.session_id
          AND campaigns.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM bot_sessions
          JOIN campaigns ON campaigns.id = bot_sessions.campaign_id
          WHERE bot_sessions.id = performance_metrics.session_id
          AND campaigns.user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_id ON performance_metrics(session_id);

-- Create browser_plugins table
CREATE TABLE IF NOT EXISTS browser_plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  extension_id text,
  enabled boolean DEFAULT true,
  configuration jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE browser_plugins ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'browser_plugins' AND policyname = 'Users can manage plugins of own campaigns'
  ) THEN
    CREATE POLICY "Users can manage plugins of own campaigns"
      ON browser_plugins FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM campaigns
          WHERE campaigns.id = browser_plugins.campaign_id
          AND campaigns.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM campaigns
          WHERE campaigns.id = browser_plugins.campaign_id
          AND campaigns.user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_browser_plugins_campaign_id ON browser_plugins(campaign_id);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES bot_sessions(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('pageview', 'click', 'conversion', 'error', 'custom')),
  event_category text,
  event_action text,
  event_label text,
  event_value decimal,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_events' AND policyname = 'Users can manage events of own sessions'
  ) THEN
    CREATE POLICY "Users can manage events of own sessions"
      ON analytics_events FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM bot_sessions
          JOIN campaigns ON campaigns.id = bot_sessions.campaign_id
          WHERE bot_sessions.id = analytics_events.session_id
          AND campaigns.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM bot_sessions
          JOIN campaigns ON campaigns.id = bot_sessions.campaign_id
          WHERE bot_sessions.id = analytics_events.session_id
          AND campaigns.user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);

-- Create google_analytics_config table
CREATE TABLE IF NOT EXISTS google_analytics_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id text,
  measurement_id text,
  api_secret text,
  service_account_key jsonb,
  enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE google_analytics_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'google_analytics_config' AND policyname = 'Users can manage own GA config'
  ) THEN
    CREATE POLICY "Users can manage own GA config"
      ON google_analytics_config FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
`;

import { supabase } from './supabase';

export async function isDatabaseSetup(): Promise<boolean> {
  try {
    // Try to query the campaigns table to check if it exists
    const { error } = await supabase
      .from('campaigns')
      .select('id')
      .limit(1);

    // If there's no error, table exists and is accessible
    if (!error) return true;

    // Check if the error is about missing table/relation
    const isMissingTable = error.message.includes('relation') ||
                          error.message.includes('does not exist') ||
                          error.code === 'PGRST204' ||
                          error.code === '42P01';

    return !isMissingTable;
  } catch (error) {
    console.error('Database setup check failed:', error);
    return false;
  }
}
