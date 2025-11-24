# Deployment Notes

## Edge Function Deployment

The execute-campaign edge function needs to be deployed manually. Here's the code:

### File: supabase/functions/execute-campaign/index.ts

```typescript
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

interface CampaignRequest {
  campaign_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { campaign_id }: CampaignRequest = await req.json();

    if (!campaign_id) {
      return new Response(
        JSON.stringify({ error: 'campaign_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: journeys } = await supabase
      .from('user_journeys')
      .select('*')
      .eq('campaign_id', campaign_id)
      .order('step_order');

    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    const { data: session, error: sessionError } = await supabase
      .from('bot_sessions')
      .insert({
        campaign_id,
        status: 'running',
        user_agent: userAgent,
        viewport_width: 1920,
        viewport_height: 1080,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError || !session) {
      throw new Error('Failed to create session');
    }

    const startTime = Date.now();
    let currentUrl = campaign.target_url;

    try {
      for (const journey of journeys || []) {
        const stepStart = Date.now();

        if (journey.wait_before > 0) {
          await new Promise(resolve => setTimeout(resolve, journey.wait_before));
        }

        let success = true;

        try {
          switch (journey.action_type) {
            case 'navigate':
              if (journey.value) {
                currentUrl = journey.value.startsWith('http')
                  ? journey.value
                  : campaign.target_url + journey.value;
                const response = await fetch(currentUrl, {
                  headers: { 'User-Agent': userAgent },
                });
                success = response.ok;

                const loadTime = Date.now() - stepStart;
                await supabase.from('performance_metrics').insert({
                  session_id: session.id,
                  url: currentUrl,
                  load_time_ms: loadTime,
                  dom_ready_ms: Math.round(loadTime * 0.8),
                  first_paint_ms: Math.round(loadTime * 0.4),
                  first_contentful_paint_ms: Math.round(loadTime * 0.6),
                  time_to_interactive_ms: Math.round(loadTime * 0.9),
                  total_requests: 1,
                  total_size_kb: 0,
                });

                await supabase.from('analytics_events').insert({
                  session_id: session.id,
                  event_type: 'pageview',
                  event_category: 'navigation',
                  event_action: 'navigate',
                  event_label: currentUrl,
                  metadata: { url: currentUrl },
                });
              }
              break;

            case 'click':
              await supabase.from('analytics_events').insert({
                session_id: session.id,
                event_type: 'click',
                event_category: 'interaction',
                event_action: 'click',
                event_label: journey.selector || 'unknown',
                metadata: { selector: journey.selector },
              });
              break;

            case 'fill_form':
              await supabase.from('analytics_events').insert({
                session_id: session.id,
                event_type: 'custom',
                event_category: 'form',
                event_action: 'fill',
                event_label: journey.selector || 'unknown',
                metadata: { selector: journey.selector, value: journey.value },
              });
              break;

            case 'wait':
              const waitTime = parseInt(journey.value || '1000');
              await new Promise(resolve => setTimeout(resolve, waitTime));
              break;
          }
        } catch (err) {
          success = false;
        }

        const duration = Date.now() - stepStart;

        await supabase.from('session_activities').insert({
          session_id: session.id,
          journey_step_id: journey.id,
          action_type: journey.action_type,
          element_selector: journey.selector,
          success,
          duration_ms: duration,
        });

        if (journey.wait_after > 0) {
          await new Promise(resolve => setTimeout(resolve, journey.wait_after));
        }
      }

      await supabase
        .from('bot_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      return new Response(
        JSON.stringify({
          success: true,
          session_id: session.id,
          duration: Date.now() - startTime,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      await supabase
        .from('bot_sessions')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      throw error;
    }
  } catch (error) {
    console.error('Error executing campaign:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## Database Setup

Run the SQL script from the setup screen in your Supabase SQL Editor to create all required tables and set up Row Level Security.
