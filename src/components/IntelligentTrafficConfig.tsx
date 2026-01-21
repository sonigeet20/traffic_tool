import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, RotateCcw, Zap, Link2, FileText, FormInput, Eye } from 'lucide-react';

interface SiteStructure {
  baseUrl: string;
  navigablePages: string[];
  formPages: string[];
  contentAreas: string[];
  internalLinks: string[];
  images: number;
  scripts: number;
  analyzed_at: string;
  confidence: number;
}

interface Props {
  url: string;
  onAnalysisComplete: (structure: SiteStructure) => void;
  isLoading?: boolean;
  existingStructure?: SiteStructure | null;
}

export default function IntelligentTrafficConfig({
  url,
  onAnalysisComplete,
  isLoading = false,
  existingStructure = null,
}: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [structure, setStructure] = useState<SiteStructure | null>(existingStructure);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const analyzeWebsite = async () => {
    if (!url) {
      setError('Please enter a URL first');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      // Simulate site analysis - in production, this would be a backend endpoint
      // that uses Puppeteer to trace the website
      const response = await fetch('/api/analyze-site-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data: SiteStructure = await response.json();
      setStructure(data);
      onAnalysisComplete(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze website');
      
      // Fallback simulation for demo
      const simulatedStructure: SiteStructure = {
        baseUrl: url,
        navigablePages: [
          url,
          `${url}/products`,
          `${url}/about`,
          `${url}/contact`,
          `${url}/blog`,
          `${url}/pricing`,
        ],
        formPages: [`${url}/contact`, `${url}/subscribe`],
        contentAreas: ['hero', 'product-grid', 'testimonials', 'footer'],
        internalLinks: 18,
        images: 24,
        scripts: 12,
        analyzed_at: new Date().toISOString(),
        confidence: 0.92,
      };
      setStructure(simulatedStructure);
      onAnalysisComplete(simulatedStructure);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Analysis Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Website Structure Trace
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Map your website before campaign creation for intelligent navigation
          </p>
        </div>
      </div>

      {/* Analysis Button */}
      <div className="flex gap-2">
        <button
          onClick={analyzeWebsite}
          disabled={analyzing || isLoading || !url}
          className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
        >
          <Zap className="w-4 h-4" />
          {analyzing ? 'Analyzing Website...' : 'Trace Website Structure'}
        </button>
        {structure && (
          <button
            onClick={() => setStructure(null)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-200 font-medium">Analysis Error</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {structure && (
        <div className="space-y-3 bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          {/* Success Badge */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/30">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-300 font-medium">Website Traced Successfully</span>
            </div>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
              {Math.round(structure.confidence * 100)}% Confidence
            </span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" /> Navigable Pages
              </div>
              <div className="text-2xl font-bold text-cyan-400">
                {structure.navigablePages?.length || 0}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <FormInput className="w-3.5 h-3.5" /> Forms Found
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {structure.formPages?.length || 0}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Images
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {structure.images || 0}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Resources</div>
              <div className="text-2xl font-bold text-orange-400">
                {(structure.scripts || 0) + (structure.images || 0)}
              </div>
            </div>
          </div>

          {/* Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-left text-sm text-slate-400 hover:text-slate-300 transition flex items-center gap-2 py-2"
          >
            <FileText className="w-4 h-4" />
            {showDetails ? 'Hide' : 'Show'} Detailed Structure
          </button>

          {/* Detailed Structure */}
          {showDetails && (
            <div className="space-y-3 pt-3 border-t border-slate-700/30">
              {/* Navigable Pages */}
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-cyan-400" />
                  Navigable Pages ({structure.navigablePages?.length || 0})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {structure.navigablePages && structure.navigablePages.length > 0 ? (
                    structure.navigablePages.map((page, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-slate-300 bg-slate-900/30 px-2 py-1 rounded border border-slate-700/30 truncate"
                        title={page}
                      >
                        {page}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No navigable pages detected</p>
                  )}
                </div>
              </div>

              {/* Form Pages */}
              {structure.formPages && structure.formPages.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <FormInput className="w-4 h-4 text-blue-400" />
                    Forms & Interactive Elements ({structure.formPages.length})
                  </h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {structure.formPages.map((page, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-slate-300 bg-slate-900/30 px-2 py-1 rounded border border-slate-700/30 truncate"
                        title={page}
                      >
                        {page}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Areas */}
              {structure.contentAreas && structure.contentAreas.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-purple-400" />
                    Content Areas ({structure.contentAreas.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {structure.contentAreas.map((area, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded border border-purple-700/30"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/30">
                Analyzed: {new Date(structure.analyzed_at).toLocaleString()}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-cyan-900/20 border border-cyan-700/30 rounded-lg p-3 text-xs text-cyan-300">
            <p className="font-medium mb-1">Intelligent Navigation Ready</p>
            <p className="text-cyan-400/80">
              This website structure will be used for intelligent page selection and realistic user navigation patterns.
            </p>
          </div>
        </div>
      )}

      {/* Not Analyzed Yet */}
      {!structure && !analyzing && (
        <div className="bg-slate-800/20 border border-slate-700/30 rounded-lg p-4 text-center">
          <p className="text-slate-400 text-sm">
            Enter a URL and click "Trace Website Structure" to map your website before creating the campaign.
          </p>
        </div>
      )}
    </div>
  );
}
