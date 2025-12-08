import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { ArrowLeft, TrendingUp, Activity, Clock, Zap, BarChart3, Settings } from 'lucide-react';

type Campaign = Database['public']['Tables']['campaigns']['Row'];

interface AnalyticsDashboardProps {
  campaigns: Campaign[];
  onBack: () => void;
}

interface AnalyticsData {
  totalSessions: number;
  completedSessions: number;
  failedSessions: number;
  avgLoadTime: number;
  avgDomReady: number;
  avgFCP: number;
  totalEvents: number;
}

export default function AnalyticsDashboard({ campaigns, onBack }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSessions: 0,
    completedSessions: 0,
    failedSessions: 0,
    avgLoadTime: 0,
    avgDomReady: 0,
    avgFCP: 0,
    totalEvents: 0,
  });
  const [gaConfig, setGaConfig] = useState<any>(null);
  const [showGaSetup, setShowGaSetup] = useState(false);
  const [gaForm, setGaForm] = useState({
    measurement_id: '',
    api_secret: '',
    property_id: '',
  });

  useEffect(() => {
    loadAnalytics();
    loadGAConfig();
  }, [campaigns]);

  async function loadAnalytics() {
    const campaignIds = campaigns.map((c) => c.id);

    if (campaignIds.length === 0) return;

    const { data: sessions } = await supabase
      .from('bot_sessions')
      .select('id, status')
      .in('campaign_id', campaignIds);

    const totalSessions = sessions?.length || 0;
    const completedSessions = sessions?.filter((s) => s.status === 'completed').length || 0;
    const failedSessions = sessions?.filter((s) => s.status === 'failed').length || 0;

    const sessionIds = sessions?.map((s) => s.id) || [];

    let avgLoadTime = 0;
    let avgDomReady = 0;
    let avgFCP = 0;

    if (sessionIds.length > 0) {
      const { data: metrics } = await supabase
        .from('performance_metrics')
        .select('load_time_ms, dom_ready_ms, first_contentful_paint_ms')
        .in('session_id', sessionIds);

      if (metrics && metrics.length > 0) {
        avgLoadTime = Math.round(
          metrics.reduce((sum, m) => sum + (m.load_time_ms || 0), 0) / metrics.length
        );
        avgDomReady = Math.round(
          metrics.reduce((sum, m) => sum + (m.dom_ready_ms || 0), 0) / metrics.length
        );
        avgFCP = Math.round(
          metrics.reduce((sum, m) => sum + (m.first_contentful_paint_ms || 0), 0) / metrics.length
        );
      }

      const { count } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .in('session_id', sessionIds);

      setAnalytics({
        totalSessions,
        completedSessions,
        failedSessions,
        avgLoadTime,
        avgDomReady,
        avgFCP,
        totalEvents: count || 0,
      });
    } else {
      setAnalytics({
        totalSessions,
        completedSessions,
        failedSessions,
        avgLoadTime: 0,
        avgDomReady: 0,
        avgFCP: 0,
        totalEvents: 0,
      });
    }
  }

  async function loadGAConfig() {
    const { data } = await supabase
      .from('google_analytics_config')
      .select('*')
      .maybeSingle();

    if (data) {
      setGaConfig(data);
      setGaForm({
        measurement_id: data.measurement_id || '',
        api_secret: data.api_secret || '',
        property_id: data.property_id || '',
      });
    }
  }

  async function handleSaveGAConfig() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('google_analytics_config')
      .upsert({
        user_id: user.id,
        measurement_id: gaForm.measurement_id,
        api_secret: gaForm.api_secret,
        property_id: gaForm.property_id,
        enabled: true,
        updated_at: new Date().toISOString(),
      });

    if (!error) {
      await loadGAConfig();
      setShowGaSetup(false);
    }
  }

  const successRate =
    analytics.totalSessions > 0
      ? Math.round((analytics.completedSessions / analytics.totalSessions) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <button
          onClick={() => setShowGaSetup(!showGaSetup)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Google Analytics Setup
        </button>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-8 h-8 text-cyan-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Analytics Overview</h2>
            <p className="text-slate-400 text-sm">Comprehensive performance metrics across all campaigns</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-300 text-sm font-medium">Total Sessions</span>
              <Activity className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="text-4xl font-bold text-white mb-1">{analytics.totalSessions}</div>
            <div className="text-xs text-slate-400">Bot sessions executed</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-300 text-sm font-medium">Success Rate</span>
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-4xl font-bold text-white mb-1">{successRate}%</div>
            <div className="text-xs text-slate-400">
              {analytics.completedSessions} completed sessions
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-600/10 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-300 text-sm font-medium">Avg Load Time</span>
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="text-4xl font-bold text-white mb-1">{analytics.avgLoadTime}ms</div>
            <div className="text-xs text-slate-400">Page load performance</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-300 text-sm font-medium">Total Events</span>
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-4xl font-bold text-white mb-1">{analytics.totalEvents}</div>
            <div className="text-xs text-slate-400">Analytics events tracked</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">DOM Ready Time</h3>
          <div className="text-5xl font-bold text-cyan-400 mb-2">{analytics.avgDomReady}ms</div>
          <p className="text-slate-400 text-sm">Average time until DOM is ready</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">First Contentful Paint</h3>
          <div className="text-5xl font-bold text-green-400 mb-2">{analytics.avgFCP}ms</div>
          <p className="text-slate-400 text-sm">Average time to first content</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Failed Sessions</h3>
          <div className="text-5xl font-bold text-red-400 mb-2">{analytics.failedSessions}</div>
          <p className="text-slate-400 text-sm">Sessions with errors</p>
        </div>
      </div>

      {showGaSetup && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Google Analytics Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Measurement ID
              </label>
              <input
                type="text"
                value={gaForm.measurement_id}
                onChange={(e) => setGaForm({ ...gaForm, measurement_id: e.target.value })}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                API Secret
              </label>
              <input
                type="password"
                value={gaForm.api_secret}
                onChange={(e) => setGaForm({ ...gaForm, api_secret: e.target.value })}
                placeholder="Enter API Secret"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Property ID
              </label>
              <input
                type="text"
                value={gaForm.property_id}
                onChange={(e) => setGaForm({ ...gaForm, property_id: e.target.value })}
                placeholder="123456789"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowGaSetup(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGAConfig}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all shadow-lg"
              >
                Save Configuration
              </button>
            </div>
          </div>

          {gaConfig && (
            <div className="mt-4 p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
              <p className="text-green-300 text-sm">
                Google Analytics is currently enabled and configured
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Active Campaigns</h3>
        {campaigns.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No campaigns created yet</p>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 bg-slate-900 rounded-lg"
              >
                <div>
                  <div className="text-white font-medium">{campaign.name}</div>
                  <div className="text-slate-400 text-sm">{campaign.target_url}</div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    campaign.status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : campaign.status === 'paused'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {campaign.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
