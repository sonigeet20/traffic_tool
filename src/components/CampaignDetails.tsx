import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { ArrowLeft, Play, Pause, RefreshCw, Activity, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

type Campaign = Database['public']['Tables']['campaigns']['Row'];
type BotSession = Database['public']['Tables']['bot_sessions']['Row'];
type PerformanceMetric = Database['public']['Tables']['performance_metrics']['Row'];

interface CampaignDetailsProps {
  campaign: Campaign;
  onBack: () => void;
  onEdit: () => void;
  onRefresh?: () => void;
}

export default function CampaignDetails({ campaign, onBack, onEdit, onRefresh }: CampaignDetailsProps) {
  const [sessions, setSessions] = useState<BotSession[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    loadData();
    const dataInterval = setInterval(loadData, 5000);
    const completeInterval = setInterval(async () => {
      await supabase.rpc('auto_complete_sessions');
    }, 10000);
    return () => {
      clearInterval(dataInterval);
      clearInterval(completeInterval);
    };
  }, [campaign.id]);

  async function loadData() {
    const { data: sessionsData } = await supabase
      .from('bot_sessions')
      .select('*')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: false });

    if (sessionsData) {
      setSessions(sessionsData);

      const sessionIds = sessionsData.map((s) => s.id);
      if (sessionIds.length > 0) {
        const { data: metricsData } = await supabase
          .from('performance_metrics')
          .select('*')
          .in('session_id', sessionIds);

        if (metricsData) setMetrics(metricsData);
      }
    }

    setLoading(false);
  }

  async function runSession() {
    const bounceRate = campaign.bounce_rate || 30;
    const shouldBounce = Math.random() * 100 < bounceRate;

    let sessionDuration: number;
    if (shouldBounce) {
      sessionDuration = Math.floor(Math.random() * 4000) + 1000;
    } else {
      const sessionDurationMin = (campaign.session_duration_min || 30) * 1000;
      const sessionDurationMax = (campaign.session_duration_max || 120) * 1000;
      sessionDuration = Math.floor(Math.random() * (sessionDurationMax - sessionDurationMin + 1)) + sessionDurationMin;
    }

    const geoLocations = campaign.target_geo_locations || ['US'];
    const geoLocation = geoLocations[Math.floor(Math.random() * geoLocations.length)];
    const sessionId = crypto.randomUUID();

    const trafficDist = campaign.traffic_source_distribution || { direct: 50, search: 50 };
    const trafficRoll = Math.random() * 100;
    const isSearchTraffic = trafficRoll > (trafficDist.direct || 50);
    const trafficSource = isSearchTraffic ? 'search' : 'direct';

    const searchKeywords = campaign.search_keywords || [];
    const searchKeyword = searchKeywords.length > 0
      ? searchKeywords[Math.floor(Math.random() * searchKeywords.length)]
      : null;

    await supabase.from('bot_sessions').insert({
      id: sessionId,
      campaign_id: campaign.id,
      status: 'running',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewport_width: 1920,
      viewport_height: 1080,
      geo_location: geoLocation,
      proxy_ip: campaign.use_residential_proxies ? 'Luna Proxy' : 'None',
      proxy_type: campaign.use_residential_proxies ? 'residential' : 'none',
      traffic_source: trafficSource,
      search_keyword: isSearchTraffic ? searchKeyword : null,
      started_at: new Date().toISOString(),
      expected_duration_ms: sessionDuration,
      is_bounced: shouldBounce,
      bounce_duration_ms: shouldBounce ? sessionDuration : null,
      google_search_attempted: isSearchTraffic,
      google_search_timestamp: isSearchTraffic ? new Date().toISOString() : null,
    });

    const payload: any = {
      url: isSearchTraffic ? 'https://www.google.com' : campaign.target_url,
      geoLocation,
      waitUntil: 'networkidle2',
      actions: [],
    };

    if (isSearchTraffic && searchKeyword) {
      const callbackUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-session-tracking`;

      payload.actions.push(
        { type: 'wait', duration: 2000 },
        { type: 'fill_form', selector: 'textarea[name="q"]', value: searchKeyword },
        { type: 'wait', duration: 1000 },
        {
          type: 'click',
          selector: 'input[name="btnK"]',
          callback: {
            url: callbackUrl,
            method: 'POST',
            body: { sessionId, event: 'google_search_completed' }
          }
        },
        { type: 'wait', duration: 3000 },
        {
          type: 'click',
          selector: `a[href*="${new URL(campaign.target_url).hostname}"]`,
          callback: {
            url: callbackUrl,
            method: 'POST',
            body: { sessionId, event: 'google_result_clicked' }
          }
        },
        {
          type: 'wait',
          duration: 2000,
          callback: {
            url: callbackUrl,
            method: 'POST',
            body: { sessionId, event: 'target_site_reached', timestamp: new Date().toISOString() }
          }
        },
        { type: 'wait', duration: sessionDuration }
      );
    } else {
      payload.actions.push({ type: 'wait', duration: sessionDuration });
    }

    if (campaign.use_residential_proxies && campaign.proxy_username && campaign.proxy_password) {
      payload.proxy = `http://${campaign.proxy_host || 'pr.lunaproxy.com'}:${campaign.proxy_port || '12233'}`;
      payload.proxyUsername = `${campaign.proxy_username}-region-us-session-${sessionId.substring(0, 8)}`;
      payload.proxyPassword = campaign.proxy_password;
    }

    if (campaign.extension_crx_url) {
      payload.extensionId = campaign.extension_crx_url;
    }

    fetch('http://13.218.100.97:3000/api/automate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  async function handleExecute() {
    const isActive = campaign.status === 'active';

    if (isActive) {
      await supabase
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('id', campaign.id);
      await loadData();
      if (onRefresh) onRefresh();
      return;
    }

    setExecuting(true);
    try {
      await supabase
        .from('campaigns')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', campaign.id);

      const sessionsPerHour = campaign.sessions_per_hour || 10;
      const intervalMs = (60 * 60 * 1000) / sessionsPerHour;

      for (let i = 0; i < 5; i++) {
        runSession();
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }

      await loadData();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error starting campaign:', error);
      alert(`Failed to start campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExecuting(false);
    }
  }

  const completedSessions = sessions.filter((s) => s.status === 'completed').length;
  const runningSessions = sessions.filter((s) => s.status === 'running').length;
  const failedSessions = sessions.filter((s) => s.status === 'failed').length;

  const avgLoadTime = metrics.length > 0
    ? Math.round(metrics.reduce((sum, m) => sum + (m.load_time_ms || 0), 0) / metrics.length)
    : 0;

  const avgDomReady = metrics.length > 0
    ? Math.round(metrics.reduce((sum, m) => sum + (m.dom_ready_ms || 0), 0) / metrics.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Campaigns
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExecute}
            disabled={executing || campaign.status === 'completed'}
            className={`px-4 py-2 ${
              campaign.status === 'active'
                ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
            } disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-lg transition-all shadow-lg flex items-center gap-2`}
          >
            {campaign.status === 'active' ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {executing ? 'Starting...' : campaign.status === 'active' ? 'Stop Campaign' : 'Start Campaign'}
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            Edit Campaign
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{campaign.name}</h2>
            <p className="text-slate-400">{campaign.target_url}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              campaign.status === 'active'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : campaign.status === 'paused'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
            }`}
          >
            {campaign.status}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Sessions</span>
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">{sessions.length}</div>
            <div className="text-xs text-slate-500">of {campaign.total_sessions} planned</div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Completed</span>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">{completedSessions}</div>
            <div className="text-xs text-slate-500">
              {sessions.length > 0 ? Math.round((completedSessions / sessions.length) * 100) : 0}% success
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Running</span>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">{runningSessions}</div>
            <div className="text-xs text-slate-500">active bots</div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Failed</span>
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">{failedSessions}</div>
            <div className="text-xs text-slate-500">errors</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Performance Metrics</h3>
          <TrendingUp className="w-5 h-5 text-cyan-400" />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="text-slate-400 text-sm mb-2">Avg Load Time</div>
            <div className="text-3xl font-bold text-white">{avgLoadTime}ms</div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4">
            <div className="text-slate-400 text-sm mb-2">Avg DOM Ready</div>
            <div className="text-3xl font-bold text-white">{avgDomReady}ms</div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4">
            <div className="text-slate-400 text-sm mb-2">Total Requests</div>
            <div className="text-3xl font-bold text-white">{metrics.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Recent Sessions</h3>
          <button
            onClick={loadData}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No sessions yet. Click "Execute Now" to start.
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 10).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      session.status === 'completed'
                        ? 'bg-green-400'
                        : session.status === 'running'
                        ? 'bg-yellow-400 animate-pulse'
                        : session.status === 'failed'
                        ? 'bg-red-400'
                        : 'bg-slate-500'
                    }`}
                  />
                  <div>
                    <div className="text-white text-sm font-medium">{session.id.slice(0, 8)}</div>
                    <div className="text-slate-500 text-xs">
                      {session.user_agent?.slice(0, 50) || 'Unknown'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-slate-400 text-sm">{session.status}</div>
                  <div className="text-slate-500 text-xs">
                    {new Date(session.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
