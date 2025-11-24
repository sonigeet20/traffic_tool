import { useState, useEffect } from 'react';
import { Search, Save, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SerpConfigData {
  api_token: string;
  api_password: string;
  customer_id: string;
  zone_name: string;
  endpoint: string;
  port: string;
  enabled: boolean;
}

export default function SerpConfig() {
  const [config, setConfig] = useState<SerpConfigData>({
    api_token: '',
    api_password: '',
    customer_id: '',
    zone_name: 'serp',
    endpoint: 'brd.superproxy.io',
    port: '33335',
    enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bright_data_serp_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig({
          api_token: data.api_token || '',
          api_password: data.api_password || '',
          customer_id: data.customer_id || '',
          zone_name: data.zone_name || 'serp',
          endpoint: data.endpoint || 'brd.superproxy.io',
          port: data.port || '33335',
          enabled: data.enabled || false,
        });
      }
    } catch (err) {
      console.error('Failed to load SERP config:', err);
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('bright_data_serp_config')
        .upsert({
          user_id: user.id,
          api_token: config.api_token,
          api_password: config.api_password,
          customer_id: config.customer_id,
          zone_name: config.zone_name,
          endpoint: config.endpoint,
          port: config.port,
          enabled: config.enabled,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      console.error('Failed to save SERP config:', err);
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-700 rounded w-1/4"></div>
          <div className="h-10 bg-slate-700 rounded"></div>
          <div className="h-10 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
          <Search className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Bright Data SERP API</h3>
          <p className="text-slate-400 text-sm">
            Configure SERP proxies for Google search campaigns with geo-targeting
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
            />
            <span className="text-sm font-medium text-slate-300">Enable Bright Data SERP API for Search Traffic</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Username (Zone)
          </label>
          <input
            type="text"
            value={config.api_token}
            onChange={(e) => setConfig({ ...config, api_token: e.target.value })}
            placeholder="brd-customer-hl_xxxxx-zone-serp"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <p className="text-xs text-slate-500 mt-1">
            Format: brd-customer-CUSTOMER_ID-zone-ZONE_NAME
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <input
            type="password"
            value={config.api_password}
            onChange={(e) => setConfig({ ...config, api_password: e.target.value })}
            placeholder="Enter your zone password"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Customer ID
          </label>
          <input
            type="text"
            value={config.customer_id}
            onChange={(e) => setConfig({ ...config, customer_id: e.target.value })}
            placeholder="hl_12345678"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Zone Name
          </label>
          <input
            type="text"
            value={config.zone_name}
            onChange={(e) => setConfig({ ...config, zone_name: e.target.value })}
            placeholder="serp"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <p className="text-xs text-slate-500 mt-1">
            The name of your SERP zone in Bright Data dashboard
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Endpoint
            </label>
            <input
              type="text"
              value={config.endpoint}
              onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
              placeholder="brd.superproxy.io"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Port
            </label>
            <input
              type="text"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: e.target.value })}
              placeholder="33335"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={saveConfig}
          disabled={saving}
          className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </>
          )}
        </button>
      </div>

      <div className="mt-6 space-y-3">
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-300 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Critical: Geo-Targeting Setup
          </h4>
          <p className="text-xs text-slate-400">
            Make sure your SERP zone username includes geo-targeting parameters. The system automatically adds <span className="text-amber-300 font-mono">-country-{'{'}code{'}'}-session-{'{'}id{'}'}</span> for proper geo-targeting and IP rotation.
          </p>
        </div>

        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-300 mb-2">Setup Instructions</h4>
          <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
            <li>Log in to your <a href="https://brightdata.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">Bright Data dashboard</a></li>
            <li>Navigate to Proxy & Scraping Infrastructure → SERP API</li>
            <li>Create or select a SERP zone</li>
            <li>Copy the username (format: brd-customer-hl_xxxxx-zone-serp) and password</li>
            <li>Paste both credentials above and enable the configuration</li>
            <li>When creating campaigns, enable "Use SERP API" to use these credentials</li>
          </ol>
          <div className="mt-3 pt-3 border-t border-blue-700/30">
            <p className="text-xs text-slate-400">
              <span className="font-medium text-blue-300">How it works:</span> SERP proxies are optimized for Google searches with automatic geo-targeting per campaign. Each session gets a unique IP from the target country.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
