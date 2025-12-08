import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { sessionId, event, timestamp, update, extensionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'sessionId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let updateData: any = {};

    if (update) {
      updateData = update;
    } else if (event) {
      switch (event) {
        case 'google_search_completed':
          updateData.google_search_completed = true;
          break;
        case 'google_result_clicked':
          updateData.google_search_result_clicked = true;
          break;
        case 'target_site_reached':
          updateData.target_site_reached_timestamp = timestamp || new Date().toISOString();
          break;
        case 'plugin_loaded':
          updateData.plugin_loaded = true;
          updateData.plugin_load_timestamp = timestamp || new Date().toISOString();
          if (extensionId) updateData.plugin_extension_id = extensionId;
          break;
        case 'plugin_active':
          updateData.plugin_active = true;
          break;
        default:
          return new Response(
            JSON.stringify({ error: 'Invalid event type' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Either event or update is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { error } = await supabase
      .from('bot_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update session', details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, event, sessionId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in update-session-tracking:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
