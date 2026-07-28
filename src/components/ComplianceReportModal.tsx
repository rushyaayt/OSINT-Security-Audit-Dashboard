import React from 'react';
import { X, Download, ShieldCheck, AlertTriangle, CheckCircle2, FileText, Printer, Sparkles, Award } from 'lucide-react';
import { ScanResult } from '../types';
import { computeComplianceScore } from '../utils/complianceCalculator';
import { generatePDFReport } from '../utils/pdfGenerator';

interface ComplianceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ScanResult;
}

export const ComplianceReportModal: React.FC<ComplianceReportModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen || !data) return null;

  const compScore = data.compliance_benchmark_score || computeComplianceScore(
    data.securityHeaders,
    data.ssl,
    data.openPorts
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generatePDFReport(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full shadow-2xl text-slate-100 overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10 backdrop-blur">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 font-mono">
                  Executive Document
                </span>
                <span className="text-3xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                  NIST & OWASP Aligned
                </span>
              </div>
              <h2 className="font-bold text-lg text-slate-100">
                Formal Compliance & Risk Report: <span className="font-mono text-emerald-400">{data.target}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition text-xs flex items-center gap-1.5"
              title="Print formal report view"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
              title="Download formal executive PDF report"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF Report</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Document Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-xs">
          {/* Executive Overview Banner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-2xs font-mono uppercase tracking-widest text-slate-400 block mb-1">
                  Target Hostname / Subnet
                </span>
                <h3 className="text-2xl font-black font-mono text-slate-100 tracking-tight">
                  {data.target}
                </h3>
                <p className="text-2xs text-slate-400 mt-1">
                  Primary IP: <span className="font-mono text-slate-200">{data.ipAddress}</span> | Audit Timestamp: {new Date(data.timestamp).toLocaleString()}
                </p>
              </div>

              {/* Grade Badge */}
              <div className="flex items-center space-x-4 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                <div className="text-center px-3 border-r border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">
                    Grade
                  </span>
                  <span className="text-3xl font-black text-emerald-400 font-mono">
                    {compScore.grade}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-slate-200">
                    Compliance Rating: <span className="text-emerald-400 font-mono font-bold">{compScore.overallScore}%</span>
                  </div>
                  <div className="text-3xs text-slate-400">
                    Passed {compScore.passedControls} of {compScore.totalControls} Security Controls
                  </div>
                  <div className="text-3xs text-rose-400 font-mono">
                    Risk Score: {data.riskScore}/100 Exposure
                  </div>
                </div>
              </div>
            </div>

            {/* Framework Benchmark Bar Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between text-2xs text-slate-400 mb-1">
                  <span>NIST SP 800-53</span>
                  <span className="font-mono font-bold text-slate-200">{compScore.frameworkScores.nist}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: `${compScore.frameworkScores.nist}%` }} />
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between text-2xs text-slate-400 mb-1">
                  <span>OWASP Top 10</span>
                  <span className="font-mono font-bold text-slate-200">{compScore.frameworkScores.owasp}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${compScore.frameworkScores.owasp}%` }} />
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between text-2xs text-slate-400 mb-1">
                  <span>CIS Controls</span>
                  <span className="font-mono font-bold text-slate-200">{compScore.frameworkScores.cis}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full" style={{ width: `${compScore.frameworkScores.cis}%` }} />
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between text-2xs text-slate-400 mb-1">
                  <span>PCI-DSS v4.0</span>
                  <span className="font-mono font-bold text-slate-200">{compScore.frameworkScores.pciDss}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${compScore.frameworkScores.pciDss}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: NIST & OWASP Benchmark Gap Analysis */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              1. NIST SP 800-53 & OWASP Benchmark Gap Analysis
            </h4>

            {compScore.findingsSummary.criticalMissing.length > 0 ? (
              <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
                  <X className="w-4 h-4" />
                  <span>Critical Compliance Control Gaps Identified ({compScore.findingsSummary.criticalMissing.length}):</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {compScore.findingsSummary.criticalMissing.map((gap, idx) => (
                    <div key={`gap-item-${idx}`} className="bg-slate-900/80 p-3 rounded-lg border border-rose-500/20 text-slate-200 flex items-start space-x-2 font-mono text-[11px]">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{gap}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 flex items-center space-x-3 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Zero Critical Benchmark Gaps Found. Security headers and SSL parameters comply with recommended NIST baselines.</span>
              </div>
            )}
          </div>

          {/* Section 2: Security Header Compliance Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              2. HTTP Security Headers Control Matrix
            </h4>

            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                    <th className="p-3">Security Header</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Observed Value</th>
                    <th className="p-3">NIST / OWASP Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {data.securityHeaders.map((header, idx) => (
                    <tr key={`hdr-row-${idx}`} className="hover:bg-slate-850/50">
                      <td className="p-3 font-semibold text-slate-200">{header.header}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          header.status === 'pass'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : header.status === 'fail'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {header.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 max-w-xs truncate">{header.value}</td>
                      <td className="p-3 text-amber-300/90 text-2xs">{header.recommendation || 'Compliant with recommended policy'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: SSL/TLS Cryptographic Profile */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              3. Cryptographic Certificate Profile (NIST SC-13 & SC-17)
            </h4>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-2xs text-slate-400">Issuer: <span className="text-slate-200 font-mono">{data.ssl.issuer}</span></div>
                <div className="text-2xs text-slate-400">Protocol: <span className="text-slate-200 font-mono">{data.ssl.protocol} ({data.ssl.keyStrength})</span></div>
              </div>
              <div className="space-y-2">
                <div className="text-2xs text-slate-400">Expiration: <span className="text-slate-200 font-mono">{data.ssl.validTo} ({data.ssl.daysRemaining} days left)</span></div>
                <div className="text-2xs text-slate-400">Status: <span className="text-emerald-400 font-mono font-bold uppercase">{data.ssl.status}</span></div>
              </div>
            </div>
          </div>

          {/* Executive Remediation Action Items */}
          <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 space-y-2">
            <h5 className="font-bold text-indigo-300 text-xs flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Executive Remediation Roadmap
            </h5>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-2xs leading-relaxed">
              <li>Enforce HTTP Strict Transport Security (HSTS) with <code className="text-indigo-300 font-mono">max-age=31536000; includeSubDomains</code> to satisfy NIST SC-8.</li>
              <li>Deploy a tight Content Security Policy (CSP) header restricting script domains to mitigate OWASP A03 Injection vectors.</li>
              <li>Verify all unencrypted internal or administrative database ports (e.g. 3306, 5432, 27017) are blocked by firewall rules.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <span className="text-3xs font-mono text-slate-500">
            Document ID: {data.id} | Generated by OSINT Executive Auditor
          </span>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              Download Formal PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
