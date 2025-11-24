import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const puppeteerServerUrl = 'http://13.218.100.97:3000';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Campaign scheduler triggered at:', new Date().toISOString());

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: stuckSessions } = await supabase
      .from('bot_sessions')
      .select('id')
      .eq('status', 'running')
      .lt('started_at', fiveMinutesAgo);

    if (stuckSessions && stuckSessions.length > 0) {
      console.log(`Found ${stuckSessions.length} stuck sessions, marking as failed`);
      await supabase
        .from('bot_sessions')
        .update({
          status: 'failed',
          error_message: 'Session timeout - exceeded 5 minutes',
          completed_at: new Date().toISOString(),
        })
        .eq('status', 'running')
        .lt('started_at', fiveMinutesAgo);
    }

    const { data: activeCampaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active');

    if (campaignsError || !activeCampaigns || activeCampaigns.length === 0) {
      console.log('No active campaigns found');
      return new Response(
        JSON.stringify({ message: 'No active campaigns', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${activeCampaigns.length} active campaigns`);
    const results = [];

    for (const campaign of activeCampaigns) {
      try {
        const { count: allSessionsCount } = await supabase
          .from('bot_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .in('status', ['completed', 'failed', 'running']);

        const totalSessionsCreated = allSessionsCount || 0;

        if (totalSessionsCreated >= campaign.total_sessions) {
          const { count: runningCount } = await supabase
            .from('bot_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .eq('status', 'running');

          const stillRunning = runningCount || 0;

          if (stillRunning === 0) {
            await supabase
              .from('campaigns')
              .update({ status: 'completed', completed_at: new Date().toISOString() })
              .eq('id', campaign.id);

            console.log(`Campaign ${campaign.id} completed: All ${totalSessionsCreated} sessions finished`);
            results.push({ campaignId: campaign.id, status: 'completed', totalSessions: totalSessionsCreated, running: 0 });
          } else {
            console.log(`Campaign ${campaign.id}: Target reached (${totalSessionsCreated}/${campaign.total_sessions}), waiting for ${stillRunning} running sessions to complete`);
            results.push({
              campaignId: campaign.id,
              status: 'waiting_for_completion',
              totalSessions: totalSessionsCreated,
              running: stillRunning
            });
          }
          continue;
        }

        const { count: completedCount } = await supabase
          .from('bot_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .eq('status', 'completed');

        const totalSessionsCompleted = completedCount || 0;

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count: completedThisHour } = await supabase
          .from('bot_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .eq('status', 'completed')
          .gte('completed_at', oneHourAgo);

        const sessionsPerHour = campaign.sessions_per_hour || 10;
        const completedThisHourCount = completedThisHour || 0;

        if (completedThisHourCount >= sessionsPerHour) {
          console.log(`Campaign ${campaign.id}: Hourly target already met (${completedThisHourCount}/${sessionsPerHour})`);
          results.push({
            campaignId: campaign.id,
            status: 'hourly_target_met',
            completedThisHour: completedThisHourCount,
            hourlyTarget: sessionsPerHour
          });
          continue;
        }

        const remainingForHour = sessionsPerHour - completedThisHourCount;
        const remainingOverall = campaign.total_sessions - totalSessionsCreated;
        const sessionsToRun = Math.min(remainingForHour, remainingOverall);

        console.log(`Campaign ${campaign.id}: Creating ${sessionsToRun} new sessions (${totalSessionsCreated}/${campaign.total_sessions} total created, ${completedThisHourCount}/${sessionsPerHour} completed this hour)`);

        await executeHourlyBatch(supabase, campaign, sessionsToRun, puppeteerServerUrl);

        results.push({
          campaignId: campaign.id,
          status: 'processed',
          sessionsCreated: sessionsToRun,
          totalCreated: totalSessionsCreated + sessionsToRun,
          completedThisHour: completedThisHourCount,
          hourlyTarget: sessionsPerHour,
          totalTarget: campaign.total_sessions
        });
      } catch (error) {
        console.error(`Error processing campaign ${campaign.id}:`, error);
        results.push({ campaignId: campaign.id, status: 'error', error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: activeCampaigns.length, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scheduler error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function executeHourlyBatch(
  supabase: any,
  campaign: any,
  sessionsToRun: number,
  puppeteerServerUrl: string
) {
  const targetGeoLocations = campaign.target_geo_locations || ['US'];
  const trafficSourceDist = campaign.traffic_source_distribution || { direct: 50, search: 50 };
  const searchKeywords = campaign.search_keywords || [];
  const useSerpApi = campaign.use_serp_api || false;
  const useProxies = campaign.use_residential_proxies || false;
  const proxyUsername = campaign.proxy_username;
  const proxyPassword = campaign.proxy_password;
  const proxyHost = campaign.proxy_host || 'pr.lunaproxy.com';
  const proxyPort = campaign.proxy_port || '12233';
  const extensionCrxUrl = campaign.extension_crx_url;
  const bounceRate = campaign.bounce_rate || 30;
  const sessionDurationMin = (campaign.session_duration_min || 30) * 1000;
  const sessionDurationMax = (campaign.session_duration_max || 120) * 1000;
  const customReferrer = campaign.custom_referrer;

  const { data: userJourney } = await supabase
    .from('user_journeys')
    .select('*')
    .eq('campaign_id', campaign.id)
    .order('step_order', { ascending: true });

  const getGeoCode = (location: string) => {
    const geoMap: Record<string, string> = {
      'US': 'us', 'CA': 'ca', 'GB': 'gb', 'DE': 'de', 'FR': 'fr',
      'AU': 'au', 'JP': 'jp', 'IN': 'in', 'BR': 'br', 'MX': 'mx'
    };
    return geoMap[location] || 'us';
  };

  for (let i = 0; i < sessionsToRun; i++) {
    const sessionId = crypto.randomUUID();
    const geoLocation = targetGeoLocations[Math.floor(Math.random() * targetGeoLocations.length)];
    const rand = Math.random() * 100;
    const trafficSource = rand < trafficSourceDist.direct ? 'direct' : 'search';
    const searchKeyword = trafficSource === 'search' && searchKeywords.length > 0
      ? searchKeywords[Math.floor(Math.random() * searchKeywords.length)]
      : null;

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    let proxyIP = 'None';
    let proxyType = 'none';
    let willUseProxy = false;

    if (useSerpApi && trafficSource === 'search' && searchKeyword) {
      // Use Bright Data for search traffic
      proxyIP = 'Bright Data (SERP)';
      proxyType = 'serp_api';
      willUseProxy = false;  // Bright Data config comes from bright_data_serp_config table
    } else if (useProxies && proxyUsername && proxyPassword && proxyUsername.trim() && proxyPassword.trim()) {
      // Use Luna proxy for direct traffic (or all traffic if SERP API not enabled)
      proxyIP = `Luna Proxy (${getGeoCode(geoLocation)})`;
      proxyType = 'residential';
      willUseProxy = true;
    }

    const shouldBounce = Math.random() * 100 < bounceRate;
    const bounceDuration = shouldBounce ? Math.floor(Math.random() * 4000) + 1000 : null;

    const sessionDuration = Math.floor(Math.random() * (sessionDurationMax - sessionDurationMin + 1)) + sessionDurationMin;

    await supabase.from('bot_sessions').insert({
      id: sessionId,
      campaign_id: campaign.id,
      status: 'running',
      user_agent: userAgent,
      viewport_width: 1920,
      viewport_height: 1080,
      geo_location: geoLocation,
      proxy_ip: proxyIP,
      proxy_type: proxyType,
      traffic_source: trafficSource,
      search_keyword: searchKeyword,
      referrer: trafficSource === 'search' ? `https://www.google.com/search?q=${searchKeyword}` : null,
      is_bounced: shouldBounce,
      bounce_duration_ms: bounceDuration,
      started_at: new Date().toISOString(),
    });

    const startTime = Date.now();
    const waitTime = shouldBounce ? bounceDuration : sessionDuration;

    const requestPayload: any = {
      url: campaign.target_url,
      actions: [{ type: 'wait', duration: waitTime }],
      geoLocation: geoLocation,
      waitUntil: 'networkidle2',
      extensionCrxUrl: extensionCrxUrl,
      userJourney: shouldBounce ? [] : (userJourney || []),
      sessionId: sessionId,
      supabaseUrl: Deno.env.get('SUPABASE_URL'),
      supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      customReferrer: customReferrer || null,
      sessionDurationMin: campaign.session_duration_min || 30,
      sessionDurationMax: campaign.session_duration_max || 120,
      useSerpApi: campaign.use_serp_api || false,
      serpApiProvider: campaign.serp_api_provider || 'bright_data',
      userId: campaign.user_id
    };

    if (trafficSource === 'search' && searchKeyword) {
      requestPayload.searchKeyword = searchKeyword;
    }

    // Apply Luna proxy credentials
    // - For search traffic with SERP API: Used after clicking search result
    // - For direct traffic: Used for entire session
    // - For search without SERP API: Used for entire session
    if (useProxies && proxyUsername && proxyPassword && proxyUsername.trim() && proxyPassword.trim()) {
      const geoCode = getGeoCode(geoLocation);
      const sessionKey = sessionId.substring(0, 8);
      const lunaUsername = `${proxyUsername}-region-${geoCode}-session-${sessionKey}`;
      requestPayload.proxy = `http://${proxyHost}:${proxyPort}`;
      requestPayload.proxyUsername = lunaUsername;
      requestPayload.proxyPassword = proxyPassword;
      console.log(`[SCHEDULER] Luna proxy configured for session ${sessionId}: ${lunaUsername}`);
    }

    fetch(`${puppeteerServerUrl}/api/automate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    }).catch(() => {});

    await supabase.from('analytics_events').insert({
      session_id: sessionId,
      event_type: 'pageview',
      page_url: campaign.target_url,
      timestamp: new Date().toISOString(),
    });
  }
}
