import { Activity, Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface SetupScreenProps {
  sql: string;
  onSetup: () => void;
  isSettingUp: boolean;
  error: string | null;
}

export default function SetupScreen({ sql, onSetup, isSettingUp, error }: SetupScreenProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-6 shadow-2xl">
            <Activity className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Traffic Tester Setup</h1>
          <p className="text-slate-400 text-lg">Initialize your database to start testing</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-3">Database Initialization</h2>
            <p className="text-slate-300 mb-4">
              Run the following SQL script in your Supabase SQL Editor to set up the required tables and permissions.
            </p>
            <a
              href={`${import.meta.env.VITE_SUPABASE_URL?.replace('//', '//').split('/')[0] + '//' + import.meta.env.VITE_SUPABASE_URL?.split('/')[2]}/project/_/sql`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Open Supabase SQL Editor
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors z-10"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-slate-300" />
              )}
            </button>
            <pre className="bg-slate-900 border border-slate-700 rounded-xl p-6 overflow-x-auto max-h-96 text-sm">
              <code className="text-slate-300 font-mono">{sql}</code>
            </pre>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={onSetup}
              disabled={isSettingUp}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all shadow-lg disabled:cursor-not-allowed"
            >
              {isSettingUp ? 'Checking Setup...' : 'I\'ve Run the SQL - Check Setup'}
            </button>
            <p className="text-slate-400 text-sm text-center">
              After running the SQL script, click the button above to verify the setup
            </p>
          </div>
        </div>

        <div className="mt-8 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-3">What does this do?</h3>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>Creates tables for campaigns, bot sessions, user journeys, and analytics</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>Sets up Row Level Security policies to protect your data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>Configures indexes for optimal query performance</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>Enables Google Analytics integration capabilities</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
