import { Plus, Trash2, Puzzle } from 'lucide-react';
import type { Database } from '../lib/database.types';

type BrowserPlugin = Database['public']['Tables']['browser_plugins']['Row'];

interface PluginConfigProps {
  plugins: Partial<BrowserPlugin>[];
  onChange: (plugins: Partial<BrowserPlugin>[]) => void;
}

export default function PluginConfig({ plugins, onChange }: PluginConfigProps) {
  function addPlugin() {
    onChange([
      ...plugins,
      {
        name: '',
        extension_id: '',
        enabled: true,
        configuration: {},
      },
    ]);
  }

  function removePlugin(index: number) {
    onChange(plugins.filter((_, i) => i !== index));
  }

  function updatePlugin(index: number, updates: Partial<BrowserPlugin>) {
    onChange(plugins.map((p, i) => (i === index ? { ...p, ...updates } : p)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Browser Plugins</h3>
          <p className="text-slate-400 text-sm">
            Test how third-party extensions affect your website performance
          </p>
        </div>
        <button
          type="button"
          onClick={addPlugin}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Plugin
        </button>
      </div>

      {plugins.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-700">
          <Puzzle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">
            No plugins configured. Add browser extensions to test their impact.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plugins.map((plugin, index) => (
            <div
              key={index}
              className="bg-slate-900 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Plugin Name
                      </label>
                      <input
                        type="text"
                        value={plugin.name || ''}
                        onChange={(e) => updatePlugin(index, { name: e.target.value })}
                        placeholder="AdBlock Plus"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Extension ID
                      </label>
                      <input
                        type="text"
                        value={plugin.extension_id || ''}
                        onChange={(e) => updatePlugin(index, { extension_id: e.target.value })}
                        placeholder="cfhdojbkjhnklbpkdaibdccddilifddb"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plugin.enabled ?? true}
                        onChange={(e) => updatePlugin(index, { enabled: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                      />
                      <span className="text-sm text-slate-300">Enable this plugin</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Configuration (JSON)
                    </label>
                    <textarea
                      value={
                        typeof plugin.configuration === 'object'
                          ? JSON.stringify(plugin.configuration, null, 2)
                          : '{}'
                      }
                      onChange={(e) => {
                        try {
                          const config = JSON.parse(e.target.value);
                          updatePlugin(index, { configuration: config });
                        } catch {
                          // Invalid JSON, don't update
                        }
                      }}
                      rows={3}
                      placeholder='{"setting": "value"}'
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removePlugin(index)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-300 mb-2">How to find Extension IDs</h4>
        <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
          <li>Open Chrome and go to chrome://extensions/</li>
          <li>Enable Developer Mode (top right toggle)</li>
          <li>Find your extension and copy its ID</li>
          <li>Paste the ID in the Extension ID field above</li>
        </ol>
      </div>
    </div>
  );
}
