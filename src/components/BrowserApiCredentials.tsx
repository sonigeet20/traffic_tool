import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Loader, AlertCircle, CheckCircle } from 'lucide-react';

interface BrowserApiConfig {
  id?: string;
  user_id?: string;
  browser_customer_id: string;
  browser_username: string;
  browser_password: string;
  browser_zone: string;
  browser_endpoint: string;
  browser_port: number;
}

export default function BrowserApiCredentials() {
  const [credentials, setCredentials] = useState<BrowserApiConfig>({
    browser_customer_id: '',
    browser_username: '',
    browser_password: '',
    browser_zone: 'unblocker',
    browser_endpoint: 'brd.superproxy.io',
    browser_port: 9222,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  async function loadCredentials() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('serp_configs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const configData = data as any;
        setCredentials({
          id: configData.id,
          user_id: configData.user_id,
          browser_customer_id: configData.browser_customer_id || '',
          browser_username: configData.browser_username || '',
          browser_password: configData.browser_password || '',
          browser_zone: configData.browser_zone || 'unblocker',
          browser_endpoint: configData.browser_endpoint || 'brd.superproxy.io',
          browser_port: configData.browser_port || 9222,
        });
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
      setMessage({ type: 'error', text: 'Failed to load credentials' });
    } finally {
      setLoading(false);
    }
  }

  async function saveCredentials() {
    if (!credentials.browser_customer_id || !credentials.browser_username || !credentials.browser_password) {
      setMessage({ type: 'error', text: 'Customer ID, Username, and Password are required' });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase
        .from('serp_configs')
        .upsert as any)(
        {
          user_id: user.id,
          browser_customer_id: credentials.browser_customer_id,
          browser_username: credentials.browser_username,
          browser_password: credentials.browser_password,
          browser_zone: credentials.browser_zone,
          browser_endpoint: credentials.browser_endpoint,
          browser_port: credentials.browser_port,
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;

      setMessage({ type: 'success', text: 'Credentials saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save credentials:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save credentials' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-5 h-5 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Browser API Credentials</h2>
        <p className="text-slate-400">
          Configure your Bright Data Browser API credentials to enable automated Google searches without CAPTCHA blocks.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-900/30 border border-green-700 text-green-300'
              : 'bg-red-900/30 border border-red-700 text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
        {/* Bright Data Info Box */}
        <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-4 mb-6">
          <h3 className="text-cyan-300 font-semibold mb-2">Where to find your credentials:</h3>
          <ol className="text-cyan-200 text-sm space-y-1 list-decimal list-inside">
            <li>Log in to your Bright Data account</li>
            <li>Go to Products → Browser API → My Zones</li>
            <li>Find your zone and copy the connection string</li>
            <li>Extract: Customer ID, Password, and Zone name</li>
          </ol>
        </div>

        {/* Customer ID */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Customer ID <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={credentials.browser_customer_id}
            onChange={(e) => setCredentials({ ...credentials, browser_customer_id: e.target.value })}
            placeholder="e.g., 12345678"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <p className="text-xs text-slate-400 mt-1">Your Bright Data customer ID</p>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Username <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={credentials.browser_username}
            onChange={(e) => setCredentials({ ...credentials, browser_username: e.target.value })}
            placeholder="e.g., your_username or account_email"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <p className="text-xs text-slate-400 mt-1">Your Bright Data username or account email</p>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Password <span className="text-red-400">*</span>
          </label>
          <input
            type="password"
            value={credentials.browser_password}
            onChange={(e) => setCredentials({ ...credentials, browser_password: e.target.value })}
            placeholder="Enter your Bright Data password"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <p className="text-xs text-slate-400 mt-1">Your Bright Data account password</p>
        </div>

        {/* Zone */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Zone Name
            </label>
            <input
              type="text"
              value={credentials.browser_zone}
              onChange={(e) => setCredentials({ ...credentials, browser_zone: e.target.value })}
              placeholder="unblocker"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <p className="text-xs text-slate-400 mt-1">Default: unblocker</p>
          </div>

          {/* Port */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Port
            </label>
            <input
              type="number"
              value={credentials.browser_port}
              onChange={(e) => setCredentials({ ...credentials, browser_port: parseInt(e.target.value) || 9222 })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <p className="text-xs text-slate-400 mt-1">Default: 9222</p>
          </div>
        </div>

        {/* Endpoint */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Endpoint
          </label>
          <input
            type="text"
            value={credentials.browser_endpoint}
            onChange={(e) => setCredentials({ ...credentials, browser_endpoint: e.target.value })}
            placeholder="brd.superproxy.io"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <p className="text-xs text-slate-400 mt-1">Default: brd.superproxy.io</p>
        </div>

        {/* Save Button */}
        <button
          onClick={saveCredentials}
          disabled={saving || !credentials.browser_customer_id || !credentials.browser_username || !credentials.browser_password}
          className="w-full mt-6 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Credentials
            </>
          )}
        </button>
      </div>

      {/* Info Section */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-semibold text-white">ℹ️ How it works:</h4>
        <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
          <li>Your credentials are encrypted and stored securely in Supabase</li>
          <li>When running campaigns with search traffic, the Browser API will automatically handle CAPTCHA solving</li>
          <li>Only you can access your own credentials due to Row Level Security</li>
          <li>The Browser API uses your specified zone and geo-location for requests</li>
        </ul>
      </div>
    </div>
  );
}
