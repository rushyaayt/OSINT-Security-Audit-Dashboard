import React, { useState, useMemo } from 'react';
import { X, GitCompare, ArrowRight, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, ArrowUpRight, ArrowDownRight, Layers, Terminal } from 'lucide-react';
import { ScanHistoryItem, ScanResult, SecurityHeader, PortOverview } from '../types';

interface ScanDiffViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ScanHistoryItem[];
  initialScanA?: ScanResult;
  initialScanB?: ScanResult;
}

export const ScanDiffViewModal: React.FC<ScanDiffViewModalProps> = ({
  isOpen,
  onClose,
  history,
  initialScanA,
  initialScanB
}) => {
  // Active selected scan IDs for Scan A (Baseline) and Scan B (Recent)
  const [scanAId, setScanAId] = useState<string>(() => {
    if (initialScanA) return initialScanA.id;
    if (history.length > 1) return history[1].id;
    if (history.length > 0) return history[0].id;
    return '';
  });

  const [scanBId, setScanBId] = useState<string>(() => {
    if (initialScanB) return initialScanB.id;
    if (history.length > 0) return history[0].id;
    return '';
  });

  const [activeTab, setActiveTab] = useState<'summary' | 'ports' | 'headers' | 'tech'>('summary');

  // Resolve scan objects
  const scanA = useMemo(() => {
    if (initialScanA && initialScanA.id === scanAId) return initialScanA;
    const item = history.find(h => h.id === scanAId);
    return item ? item.result : initialScanA || (history[0] ? history[0].result : null);
  }, [scanAId, history, initialScanA]);

  const scanB = useMemo(() => {
    if (initialScanB && initialScanB.id === scanBId) return initialScanB;
    const item = history.find(h => h.id === scanBId);
    return item ? item.result : initialScanB || (history[0] ? history[0].result : null);
  }, [scanBId, history, initialScanB]);

  // Compute Diff Comparisons
  const diffAnalysis = useMemo(() => {
    if (!scanA || !scanB) return null;

    // Risk Score Delta
    const riskDelta = scanB.riskScore - scanA.riskScore; // Negative is good (risk decreased)

    // Compliance Score Delta
    const compA = scanA.compliance_benchmark_score?.overallScore ?? 0;
    const compB = scanB.compliance_benchmark_score?.overallScore ?? 0;
    const complianceDelta = compB - compA; // Positive is good

    // Ports Comparison
    const portsA = scanA.openPorts || [];
    const portsB = scanB.openPorts || [];

    const newOpenPorts: PortOverview[] = [];
    const closedPorts: PortOverview[] = [];
    const unchangedPorts: PortOverview[] = [];

    // Check ports in B vs A
    portsB.forEach(pB => {
      const pA = portsA.find(p => p.port === pB.port);
      if (pB.status === 'open') {
        if (!pA || pA.status !== 'open') {
          newOpenPorts.push(pB); // Newly opened port in scan B
        } else {
          unchangedPorts.push(pB);
        }
      }
    });

    // Check ports closed in B that were open in A
    portsA.forEach(pA => {
      if (pA.status === 'open') {
        const pB = portsB.find(p => p.port === pA.port);
        if (!pB || pB.status !== 'open') {
          closedPorts.push(pA); // Closed/Remediated
        }
      }
    });

    // Security Headers Comparison
    const headersA = scanA.securityHeaders || [];
    const headersB = scanB.securityHeaders || [];

    const remediatedHeaders: { header: string; oldVal: string; newVal: string }[] = [];
    const regressedHeaders: { header: string; oldVal: string; newVal: string }[] = [];
    const unchangedHeaders: SecurityHeader[] = [];

    headersB.forEach(hB => {
      const hA = headersA.find(h => h.header.toLowerCase() === hB.header.toLowerCase());
      if (hA) {
        if (hA.status === 'fail' && (hB.status === 'pass' || hB.status === 'warning')) {
          remediatedHeaders.push({ header: hB.header, oldVal: hA.value, newVal: hB.value });
        } else if ((hA.status === 'pass' || hA.status === 'warning') && hB.status === 'fail') {
          regressedHeaders.push({ header: hB.header, oldVal: hA.value, newVal: hB.value });
        } else {
          unchangedHeaders.push(hB);
        }
      } else if (hB.status === 'pass') {
        remediatedHeaders.push({ header: hB.header, oldVal: 'Missing', newVal: hB.value });
      }
    });

    // Subdomains comparison
    const subdomainsA = new Set((scanA.subdomains || []).map(s => s.subdomain));
    const subdomainsB = new Set((scanB.subdomains || []).map(s => s.subdomain));

    const newSubdomains = (scanB.subdomains || []).filter(s => !subdomainsA.has(s.subdomain));
    const removedSubdomains = (scanA.subdomains || []).filter(s => !subdomainsB.has(s.subdomain));

    // Tech stack comparison
    const techA = new Set((scanA.techStack || []).map(t => t.name));
    const techB = new Set((scanB.techStack || []).map(t => t.name));

    const newTech = (scanB.techStack || []).filter(t => !techA.has(t.name));
    const removedTech = (scanA.techStack || []).filter(t => !techB.has(t.name));

    return {
      riskDelta,
      complianceDelta,
      newOpenPorts,
      closedPorts,
      unchangedPorts,
      remediatedHeaders,
      regressedHeaders,
      unchangedHeaders,
      newSubdomains,
      removedSubdomains,
      newTech,
      removedTech
    };
  }, [scanA, scanB]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-100">Historical Scan Diff Comparison</h3>
              <p className="text-xs text-slate-400">
                Compare network port exposure, security headers, and risk score deltas across scan timestamps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Selectors Bar */}
        <div className="bg-slate-950/70 px-6 py-3 border-b border-slate-800/80 grid grid-cols-1 md:grid-cols-11 gap-3 items-center text-xs">
          {/* Scan A Selection */}
          <div className="md:col-span-5 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Baseline Scan (Scan A)
            </label>
            <select
              value={scanAId}
              onChange={(e) => setScanAId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 text-xs font-mono"
            >
              {history.map(item => (
                <option key={`a-${item.id}`} value={item.id}>
                  {item.target} - {new Date(item.timestamp).toLocaleString()} (Risk: {item.riskScore})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 flex justify-center text-slate-500 font-bold">
            <ArrowRight className="w-5 h-5 text-indigo-400" />
          </div>

          {/* Scan B Selection */}
          <div className="md:col-span-5 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Recent Scan (Scan B)
            </label>
            <select
              value={scanBId}
              onChange={(e) => setScanBId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 text-xs font-mono"
            >
              {history.map(item => (
                <option key={`b-${item.id}`} value={item.id}>
                  {item.target} - {new Date(item.timestamp).toLocaleString()} (Risk: {item.riskScore})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/40 text-xs font-medium space-x-6">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-indigo-400 text-indigo-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Delta Overview
          </button>
          <button
            onClick={() => setActiveTab('ports')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'ports'
                ? 'border-indigo-400 text-indigo-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Port Exposure Changes</span>
            {diffAnalysis && diffAnalysis.newOpenPorts.length > 0 && (
              <span className="bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full text-[10px]">
                +{diffAnalysis.newOpenPorts.length} New
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'headers'
                ? 'border-indigo-400 text-indigo-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Security Headers Diff</span>
            {diffAnalysis && diffAnalysis.remediatedHeaders.length > 0 && (
              <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full text-[10px]">
                {diffAnalysis.remediatedHeaders.length} Fixed
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('tech')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'tech'
                ? 'border-indigo-400 text-indigo-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Subdomains & Tech Stack Diff
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!scanA || !scanB || !diffAnalysis ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Please select two scan records to perform delta comparison.
            </div>
          ) : (
            <>
              {/* SUMMARY TAB */}
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  {/* Metric Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Risk Score Delta Card */}
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>Risk Score Delta</span>
                        <span>
                          Scan A ({scanA.riskScore}) &rarr; Scan B ({scanB.riskScore})
                        </span>
                      </div>
                      <div className="flex items-baseline space-x-3">
                        <span className="text-3xl font-bold font-mono">
                          {scanB.riskScore}
                        </span>
                        {diffAnalysis.riskDelta < 0 ? (
                          <div className="flex items-center space-x-1 text-emerald-400 font-semibold text-sm">
                            <ArrowDownRight className="w-4 h-4" />
                            <span>Risk Reduced by {Math.abs(diffAnalysis.riskDelta)} pts (Improved)</span>
                          </div>
                        ) : diffAnalysis.riskDelta > 0 ? (
                          <div className="flex items-center space-x-1 text-rose-400 font-semibold text-sm">
                            <ArrowUpRight className="w-4 h-4" />
                            <span>Risk Increased by +{diffAnalysis.riskDelta} pts (Degraded)</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-semibold">No Risk Delta</span>
                        )}
                      </div>
                    </div>

                    {/* Compliance Score Delta Card */}
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>Framework Compliance Score Delta</span>
                        <span>
                          {scanA.compliance_benchmark_score?.overallScore ?? 0}% &rarr; {scanB.compliance_benchmark_score?.overallScore ?? 0}%
                        </span>
                      </div>
                      <div className="flex items-baseline space-x-3">
                        <span className="text-3xl font-bold font-mono text-emerald-400">
                          {scanB.compliance_benchmark_score?.overallScore ?? 0}%
                        </span>
                        {diffAnalysis.complianceDelta > 0 ? (
                          <div className="flex items-center space-x-1 text-emerald-400 font-semibold text-sm">
                            <ArrowUpRight className="w-4 h-4" />
                            <span>+{diffAnalysis.complianceDelta}% Compliance Gain</span>
                          </div>
                        ) : diffAnalysis.complianceDelta < 0 ? (
                          <div className="flex items-center space-x-1 text-rose-400 font-semibold text-sm">
                            <ArrowDownRight className="w-4 h-4" />
                            <span>{diffAnalysis.complianceDelta}% Compliance Reduction</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-semibold">Compliance Unchanged</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Highlights Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Security Fixes / Progress */}
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                      <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Security Remediations & Improvements</span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {diffAnalysis.closedPorts.map(p => (
                          <li key={`closed-${p.port}`} className="flex items-center space-x-2 text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Port {p.port}/{p.service} was successfully closed/firewalled.</span>
                          </li>
                        ))}
                        {diffAnalysis.remediatedHeaders.map(h => (
                          <li key={`fixed-${h.header}`} className="flex items-center space-x-2 text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Header {h.header} configured (was {h.oldVal} &rarr; {h.newVal}).</span>
                          </li>
                        ))}
                        {diffAnalysis.closedPorts.length === 0 && diffAnalysis.remediatedHeaders.length === 0 && (
                          <li className="text-slate-500 italic">No security fixes detected between these two scans.</li>
                        )}
                      </ul>
                    </div>

                    {/* New Risks / Regressions */}
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 space-y-3">
                      <div className="flex items-center space-x-2 text-rose-400 font-semibold text-sm">
                        <ShieldAlert className="w-4 h-4" />
                        <span>New Risks & Regressions Detected</span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {diffAnalysis.newOpenPorts.map(p => (
                          <li key={`new-${p.port}`} className="flex items-center space-x-2 text-rose-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>New Open Port Exposed: Port {p.port} ({p.service})</span>
                          </li>
                        ))}
                        {diffAnalysis.regressedHeaders.map(h => (
                          <li key={`regressed-${h.header}`} className="flex items-center space-x-2 text-rose-300">
                            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Header Regression: {h.header} changed from {h.oldVal} to {h.newVal}.</span>
                          </li>
                        ))}
                        {diffAnalysis.newOpenPorts.length === 0 && diffAnalysis.regressedHeaders.length === 0 && (
                          <li className="text-slate-500 italic">No new regressions or open ports detected.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* PORTS TAB */}
              {activeTab === 'ports' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Network Port Status Delta
                  </h4>

                  <div className="space-y-3">
                    {diffAnalysis.newOpenPorts.length > 0 && (
                      <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-lg space-y-2">
                        <span className="text-xs font-bold text-rose-400 flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span>NEW OPEN PORTS IN SCAN B ({diffAnalysis.newOpenPorts.length})</span>
                        </span>
                        <div className="divide-y divide-rose-500/20 text-xs font-mono">
                          {diffAnalysis.newOpenPorts.map(p => (
                            <div key={`port-new-${p.port}`} className="py-2 flex justify-between items-center text-slate-200">
                              <span>Port {p.port} ({p.service} / {p.protocol})</span>
                              <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded text-[11px] font-semibold">
                                Newly Exposed ({p.risk.toUpperCase()})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {diffAnalysis.closedPorts.length > 0 && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg space-y-2">
                        <span className="text-xs font-bold text-emerald-400 flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>REMEDIATED / CLOSED PORTS ({diffAnalysis.closedPorts.length})</span>
                        </span>
                        <div className="divide-y divide-emerald-500/20 text-xs font-mono">
                          {diffAnalysis.closedPorts.map(p => (
                            <div key={`port-closed-${p.port}`} className="py-2 flex justify-between items-center text-slate-200">
                              <span>Port {p.port} ({p.service} / {p.protocol})</span>
                              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-semibold">
                                Successfully Closed
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg space-y-2">
                      <span className="text-xs font-bold text-slate-400">
                        UNCHANGED PORT STATES ({diffAnalysis.unchangedPorts.length})
                      </span>
                      <div className="divide-y divide-slate-800 text-xs font-mono">
                        {diffAnalysis.unchangedPorts.map(p => (
                          <div key={`port-same-${p.port}`} className="py-1.5 flex justify-between items-center text-slate-400">
                            <span>Port {p.port} ({p.service})</span>
                            <span className="text-slate-500 text-[11px]">{p.status.toUpperCase()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* HEADERS TAB */}
              {activeTab === 'headers' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Security Response Headers Audit Comparison
                  </h4>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                        <tr>
                          <th className="px-4 py-2.5">Security Header</th>
                          <th className="px-4 py-2.5">Scan A Status</th>
                          <th className="px-4 py-2.5">Scan B Status</th>
                          <th className="px-4 py-2.5 text-right">Delta State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                        {(scanB.securityHeaders || []).map(hB => {
                          const hA = (scanA.securityHeaders || []).find(h => h.header.toLowerCase() === hB.header.toLowerCase());
                          const isFixed = hA?.status === 'fail' && (hB.status === 'pass' || hB.status === 'warning');
                          const isRegressed = (hA?.status === 'pass' || hA?.status === 'warning') && hB.status === 'fail';

                          return (
                            <tr key={`hdr-diff-${hB.header}`} className="hover:bg-slate-900/40">
                              <td className="px-4 py-2.5 font-semibold text-slate-200">{hB.header}</td>
                              <td className="px-4 py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] ${
                                  !hA || hA.status === 'fail' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                  {hA ? hA.value : 'Missing'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] ${
                                  hB.status === 'fail' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                  {hB.value}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right font-sans">
                                {isFixed ? (
                                  <span className="text-emerald-400 font-semibold text-[11px]">Remediated</span>
                                ) : isRegressed ? (
                                  <span className="text-rose-400 font-semibold text-[11px]">Regressed</span>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">Unchanged</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TECH & SUBDOMAINS TAB */}
              {activeTab === 'tech' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Subdomains Delta */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center space-x-2 text-slate-200 font-semibold text-xs">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>Subdomain Changes</span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      {diffAnalysis.newSubdomains.length > 0 && (
                        <div className="text-emerald-400 space-y-1">
                          <span className="font-sans text-[11px] text-slate-400 uppercase font-semibold">Newly Discovered</span>
                          {diffAnalysis.newSubdomains.map(s => (
                            <div key={`sub-new-${s.subdomain}`} className="bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20">
                              + {s.subdomain} ({s.ip})
                            </div>
                          ))}
                        </div>
                      )}

                      {diffAnalysis.removedSubdomains.length > 0 && (
                        <div className="text-rose-400 space-y-1">
                          <span className="font-sans text-[11px] text-slate-400 uppercase font-semibold">No Longer Resolving</span>
                          {diffAnalysis.removedSubdomains.map(s => (
                            <div key={`sub-rem-${s.subdomain}`} className="bg-rose-500/10 p-1.5 rounded border border-rose-500/20">
                              - {s.subdomain}
                            </div>
                          ))}
                        </div>
                      )}

                      {diffAnalysis.newSubdomains.length === 0 && diffAnalysis.removedSubdomains.length === 0 && (
                        <p className="text-slate-500 italic text-xs font-sans">Subdomain topology remains identical.</p>
                      )}
                    </div>
                  </div>

                  {/* Tech Stack Delta */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center space-x-2 text-slate-200 font-semibold text-xs">
                      <Terminal className="w-4 h-4 text-indigo-400" />
                      <span>Tech Stack Delta</span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      {diffAnalysis.newTech.length > 0 && (
                        <div className="text-emerald-400 space-y-1">
                          <span className="font-sans text-[11px] text-slate-400 uppercase font-semibold">Newly Detected</span>
                          {diffAnalysis.newTech.map(t => (
                            <div key={`tech-new-${t.name}`} className="bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20">
                              + {t.name} ({t.category})
                            </div>
                          ))}
                        </div>
                      )}

                      {diffAnalysis.newTech.length === 0 && (
                        <p className="text-slate-500 italic text-xs font-sans">No changes in detected tech stack fingerprints.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Close Diff View
          </button>
        </div>
      </div>
    </div>
  );
};

export const ScanComparisonView = ScanDiffViewModal;
export default ScanDiffViewModal;
