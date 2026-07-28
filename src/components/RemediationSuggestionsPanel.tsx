import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Filter, 
  ChevronRight, 
  Sparkles, 
  ExternalLink,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { ScanResult, RemediationSuggestion } from '../types';
import { generateRemediationSuggestions } from '../utils/remediationHelper';

interface RemediationSuggestionsPanelProps {
  scanResult: ScanResult;
}

export const RemediationSuggestionsPanel: React.FC<RemediationSuggestionsPanelProps> = ({ scanResult }) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Compute or get remediation suggestions dynamically
  const suggestions = useMemo<RemediationSuggestion[]>(() => {
    if (scanResult.remediationSuggestions && scanResult.remediationSuggestions.length > 0) {
      return scanResult.remediationSuggestions;
    }
    return generateRemediationSuggestions(scanResult);
  }, [scanResult]);

  // Filtered suggestions list
  const filteredSuggestions = useMemo(() => {
    if (severityFilter === 'all') return suggestions;
    return suggestions.filter(s => s.severity === severityFilter);
  }, [suggestions, severityFilter]);

  // Count metrics by severity
  const counts = useMemo(() => {
    let critical = 0, high = 0, medium = 0, low = 0;
    suggestions.forEach(s => {
      if (s.severity === 'critical') critical++;
      else if (s.severity === 'high') high++;
      else if (s.severity === 'medium') medium++;
      else if (s.severity === 'low') low++;
    });
    return { total: suggestions.length, critical, high, medium, low };
  }, [suggestions]);

  // Copy single action step to clipboard
  const handleCopyStep = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy full remediation runbook to clipboard
  const handleCopyRunbook = () => {
    if (suggestions.length === 0) return;
    const lines = [
      `# Remediation Action Runbook for ${scanResult.target}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Total Action Items: ${suggestions.length}\n`,
      ...suggestions.map((s, idx) => (
        `[${idx + 1}] [${s.severity.toUpperCase()}] ${s.title}\n` +
        `Criteria: ${s.targetCriteria}\n` +
        `Suggestion: ${s.suggestion}\n` +
        (s.actionableStep ? `Action: ${s.actionableStep}\n` : '')
      ))
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const getSeverityBadge = (severity: RemediationSuggestion['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div id="remediation-suggestions-panel" className="bg-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-5 shadow-xl">
      {/* Panel Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xs uppercase font-mono font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Context-Aware Security Guidance
            </span>
            <span className="text-3xs font-mono text-slate-500">Automated Audit Remediation</span>
          </div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mt-1 font-mono">
            <Wrench className="w-4 h-4 text-amber-400" />
            Recommended Remediation Actions ({suggestions.length})
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Tailored step-by-step resolution directives derived from failed security audit criteria for <strong className="text-slate-200">{scanResult.target}</strong>.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Severity Filter Buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-2xs font-mono">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                severityFilter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({counts.total})
            </button>
            {counts.critical > 0 && (
              <button
                onClick={() => setSeverityFilter('critical')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  severityFilter === 'critical' ? 'bg-rose-600 text-white font-bold' : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                Critical ({counts.critical})
              </button>
            )}
            {counts.high > 0 && (
              <button
                onClick={() => setSeverityFilter('high')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  severityFilter === 'high' ? 'bg-orange-600 text-white font-bold' : 'text-orange-400 hover:text-orange-300'
                }`}
              >
                High ({counts.high})
              </button>
            )}
            {counts.medium > 0 && (
              <button
                onClick={() => setSeverityFilter('medium')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  severityFilter === 'medium' ? 'bg-amber-600 text-white font-bold' : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                Medium ({counts.medium})
              </button>
            )}
          </div>

          {/* Copy Runbook Button */}
          {suggestions.length > 0 && (
            <button
              onClick={handleCopyRunbook}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-2xs font-mono rounded-xl transition"
              title="Copy all remediation instructions as plain text markdown runbook"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedAll ? 'Runbook Copied!' : 'Copy Runbook'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Content List */}
      {filteredSuggestions.length === 0 ? (
        <div className="py-8 text-center space-y-2 bg-slate-900/40 rounded-xl border border-slate-800/80">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-xs font-mono text-slate-300 font-semibold">
            {severityFilter === 'all' 
              ? 'No remediation actions required! Target passed all evaluated security criteria.' 
              : `No ${severityFilter.toUpperCase()} severity remediation suggestions found.`}
          </p>
          <p className="text-3xs text-slate-500 font-mono">
            Security response headers, TLS parameters, and public port listeners meet optimal baselines.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSuggestions.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-4 space-y-2.5 transition hover:border-slate-700/90"
            >
              {/* Item Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                <div className="flex items-center gap-2.5">
                  <span className={`text-3xs uppercase font-mono font-bold px-2 py-0.5 rounded border ${getSeverityBadge(item.severity)}`}>
                    {item.severity}
                  </span>
                  <span className="text-3xs uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80">
                    {item.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-100 font-mono">
                    {item.title}
                  </h4>
                </div>

                <span className="text-3xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 self-start sm:self-auto">
                  Audit Criteria: <span className="text-rose-300 font-medium">{item.targetCriteria}</span>
                </span>
              </div>

              {/* Description & Context */}
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {item.suggestion}
              </p>

              {/* Actionable Command / Implementation Step */}
              {item.actionableStep && (
                <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-2.5 flex items-start justify-between gap-3 font-mono text-2xs text-slate-200">
                  <div className="flex items-start gap-2 overflow-x-auto">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-3xs uppercase text-slate-500 font-bold block">Resolution Step:</span>
                      <code className="text-indigo-200 break-all">{item.actionableStep}</code>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyStep(item.id, item.actionableStep!)}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition shrink-0"
                    title="Copy resolution step"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RemediationSuggestionsPanel;
