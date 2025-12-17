import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  stage: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface SessionLogsProps {
  logs?: LogEntry[];
  isLoading?: boolean;
  isExpanded?: boolean;
}

const SessionLogs: React.FC<SessionLogsProps> = ({ 
  logs = [], 
  isLoading = false,
  isExpanded = false 
}) => {
  const [expanded, setExpanded] = useState(isExpanded);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<'all' | 'success' | 'warning' | 'error'>('all');

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const copyLogs = () => {
    const logText = logs
      .map(log => `[${log.timestamp}] [${log.stage}] ${log.message}`)
      .join('\n');
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const successCount = logs.filter(l => l.type === 'success').length;
  const errorCount = logs.filter(l => l.type === 'error').length;
  const warningCount = logs.filter(l => l.type === 'warning').length;

  return (
    <div className="bg-white rounded-lg shadow mt-6 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Session Logs</h3>
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
            {logs.length} entries
          </span>
          
          {/* Status badges */}
          <div className="flex gap-2">
            {successCount > 0 && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                ✓ {successCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                ⚠️ {warningCount}
              </span>
            )}
            {errorCount > 0 && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                ✗ {errorCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyLogs();
              }}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Copy all logs"
            >
              {copied ? (
                <Check size={18} className="text-green-600" />
              ) : (
                <Copy size={18} className="text-gray-500" />
              )}
            </button>
          )}
          {expanded ? (
            <ChevronUp size={20} className="text-gray-500" />
          ) : (
            <ChevronDown size={20} className="text-gray-500" />
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-6 py-4 bg-gray-50">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {isLoading ? 'Logs will appear here as the session runs...' : 'No logs yet'}
              </p>
            </div>
          ) : (
            <>
              {/* Filter buttons */}
              <div className="flex gap-2 mb-4">
                {(['all', 'success', 'warning', 'error'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      filter === type
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                    {type !== 'all' && ` (${logs.filter(l => l.type === type).length})`}
                  </button>
                ))}
              </div>

              {/* Logs list */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLogs.length === 0 ? (
                  <p className="text-gray-500 text-sm">No logs with this filter</p>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-3 border rounded text-sm font-mono ${getLogColor(log.type)}`}
                    >
                      <div className="flex gap-2">
                        <span className="font-bold w-6">{getLogIcon(log.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between">
                            <span className="font-bold">[{log.stage}]</span>
                            <span className="text-xs opacity-75">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="mt-1 break-words">{log.message}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionLogs;
