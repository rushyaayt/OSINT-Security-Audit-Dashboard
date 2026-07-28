import React, { useState } from 'react';
import { 
  History, 
  X, 
  Trash2, 
  ChevronRight, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Globe, 
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { ScanHistoryItem } from '../types';

interface ScanHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: ScanHistoryItem[];
  onSelectScan: (item: ScanHistoryItem) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearAllHistory: () => void;
  currentActiveId?: string;
}

export function ScanHistorySidebar({
  isOpen,
  onClose,
  history,
  onSelectScan,
  onDeleteHistoryItem,
  onClearAllHistory,
  currentActiveId
}: ScanHistorySidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredHistory = history.filter(item => 
    item.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ipAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Scan History</h2>
                <p className="text-2xs text-slate-400">{history.length} Saved Reconnaissance Audits</p>
              </div>
            </div>

            <button
              id="btn-close-history-sidebar"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar & Clear Button */}
          <div className="p-4 border-b border-slate-800/80 space-y-3 bg-slate-900/30">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                id="input-search-history"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search domain or IP..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {history.length > 0 && (
              <div className="flex items-center justify-between text-2xs">
                <span className="text-slate-400 font-mono">Showing {filteredHistory.length} of {history.length}</span>
                <button
                  id="btn-clear-all-history"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear all scan history?")) {
                      onClearAllHistory();
                    }
                  }}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition font-mono"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* History Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs text-slate-400 font-medium">No prior scan history found</p>
                <p className="text-2xs text-slate-500">Scanned targets will appear here automatically.</p>
              </div>
            ) : (
              filteredHistory.map((item) => {
                const isActive = item.id === currentActiveId;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition group relative ${
                      isActive
                        ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30'
                        : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 cursor-pointer" onClick={() => { onSelectScan(item); onClose(); }}>
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-mono text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition">
                            {item.target}
                          </span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-3xs font-mono rounded">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-2xs font-mono text-slate-400">
                          <span>IP: {item.ipAddress}</span>
                          <span>•</span>
                          <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Risk Score Badge */}
                        <span className={`px-2 py-0.5 rounded text-2xs font-mono font-semibold ${
                          item.riskScore > 50 
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                            : item.riskScore > 25 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          Risk {item.riskScore}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHistoryItem(item.id);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-3xs text-slate-400 font-mono">
                      <span>Date: {new Date(item.timestamp).toLocaleDateString()}</span>
                      <button
                        onClick={() => { onSelectScan(item); onClose(); }}
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                      >
                        Load Findings <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-800 text-center text-3xs text-slate-500 bg-slate-900/40 font-mono">
            Audit history stored locally in encrypted browser session
          </div>
        </div>
      </div>
    </div>
  );
}
