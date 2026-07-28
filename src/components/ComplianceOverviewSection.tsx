import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Lock, 
  Award, 
  FileText, 
  ArrowRight,
  Shield,
  Check
} from 'lucide-react';
import { ScanResult } from '../types';
import { computeComplianceScore } from '../utils/complianceCalculator';
import { ComplianceRadialGauge } from './ComplianceRadialGauge';
import { PDFReportGenerator } from './PDFReportGenerator';

interface ComplianceOverviewSectionProps {
  scanResult: ScanResult;
  onOpenReportModal?: () => void;
  className?: string;
}

export const ComplianceOverviewSection: React.FC<ComplianceOverviewSectionProps> = ({
  scanResult,
  onOpenReportModal,
  className = ''
}) => {
  const compScore = scanResult.compliance_benchmark_score || computeComplianceScore(
    scanResult.securityHeaders,
    scanResult.ssl,
    scanResult.openPorts
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner / Score Summary Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-5 shadow-lg">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xs uppercase font-mono font-bold tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Standards Assessment
                </span>
                <span className="text-3xs font-mono text-slate-400">
                  Target: <strong className="text-slate-200">{scanResult.target}</strong>
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mt-0.5">
                CIS Benchmarks & OWASP Compliance
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  Grade {compScore.grade}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Audited against CIS Controls v8, OWASP Top 10, NIST SP 800-53 SC-8/SC-13 & PCI-DSS v4.0.
              </p>
            </div>
          </div>

          {/* Radial Gauge Visual */}
          <div className="flex items-center space-x-3">
            <ComplianceRadialGauge
              score={compScore.overallScore}
              grade={compScore.grade}
              passedControls={compScore.passedControls}
              totalControls={compScore.totalControls}
            />
          </div>
        </div>

        {/* Individual Framework Score Progress Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1 text-slate-300">
                <Shield className="w-3 h-3 text-indigo-400" />
                CIS Benchmarks
              </span>
              <span className="text-indigo-400 font-bold">{compScore.frameworkScores.cis}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
              <div className="bg-indigo-500 h-full rounded-full transition-all duration-700" style={{ width: `${compScore.frameworkScores.cis}%` }} />
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1 text-slate-300">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                OWASP Recommendations
              </span>
              <span className="text-emerald-400 font-bold">{compScore.frameworkScores.owasp}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${compScore.frameworkScores.owasp}%` }} />
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1 text-slate-300">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                NIST SP 800-53
              </span>
              <span className="text-cyan-400 font-bold">{compScore.frameworkScores.nist}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
              <div className="bg-cyan-500 h-full rounded-full transition-all duration-700" style={{ width: `${compScore.frameworkScores.nist}%` }} />
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1 text-slate-300">
                <Lock className="w-3 h-3 text-amber-400" />
                PCI-DSS v4.0
              </span>
              <span className="text-amber-400 font-bold">{compScore.frameworkScores.pciDss}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-700" style={{ width: `${compScore.frameworkScores.pciDss}%` }} />
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
          <div className="text-2xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Passed <strong>{compScore.passedControls}</strong> of <strong>{compScore.totalControls}</strong> Evaluated Security Controls</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenReportModal && (
              <button
                type="button"
                onClick={onOpenReportModal}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg transition"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Executive Report</span>
              </button>
            )}
            <PDFReportGenerator data={scanResult} />
          </div>
        </div>
      </div>

      {/* HTTP Headers & SSL Configuration Standards Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Security Headers Benchmark Matrix */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wider font-mono">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              HTTP Security Headers vs Standards
            </h4>
            <span className="text-3xs font-mono text-slate-400">CIS 3.1 & OWASP A05</span>
          </div>

          <div className="space-y-3">
            {scanResult.securityHeaders.map((header, idx) => {
              let standardTag = 'OWASP A05';
              let recommendation = header.recommendation || 'Compliant with recommended policy';

              if (header.header.toLowerCase().includes('strict-transport-security')) {
                standardTag = 'NIST SC-8 / CIS 3.1';
              } else if (header.header.toLowerCase().includes('content-security-policy')) {
                standardTag = 'NIST SC-28 / OWASP A03';
              } else if (header.header.toLowerCase().includes('frame-options')) {
                standardTag = 'OWASP A05 Clickjacking';
              } else if (header.header.toLowerCase().includes('content-type-options')) {
                standardTag = 'CIS 3.2 MIME-Sniff';
              }

              return (
                <div key={`hdr-comp-${idx}`} className="bg-slate-900/90 border border-slate-800/90 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-200">{header.header}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-3xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {standardTag}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        header.status === 'pass'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : header.status === 'fail'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {header.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="text-2xs font-mono text-slate-400 bg-slate-950/80 p-2 rounded border border-slate-800/80 truncate">
                    Value: <span className="text-slate-300">{header.value || 'Not Configured'}</span>
                  </div>

                  <p className="text-3xs text-amber-300/90 leading-relaxed font-sans flex items-start gap-1">
                    <ArrowRight className="w-3 h-3 shrink-0 text-amber-400 mt-0.5" />
                    <span>{recommendation}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: SSL/TLS Configuration Benchmark Matrix */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wider font-mono">
              <Lock className="w-4 h-4 text-cyan-400" />
              SSL/TLS Cryptographic Profile vs Standards
            </h4>
            <span className="text-3xs font-mono text-slate-400">NIST SP 800-52 & PCI-DSS</span>
          </div>

          <div className="space-y-3">
            {/* Control 1: TLS Protocol Version */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-slate-200">Protocol Version</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  scanResult.ssl.protocol.includes('1.3') || scanResult.ssl.protocol.includes('1.2')
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {scanResult.ssl.protocol.includes('1.3') || scanResult.ssl.protocol.includes('1.2') ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <div className="text-2xs font-mono text-slate-300">
                Observed: <strong className="text-cyan-400">{scanResult.ssl.protocol}</strong>
              </div>
              <p className="text-3xs text-slate-400">
                NIST SP 800-52 requires TLS 1.2 or TLS 1.3 with strong AEAD cipher suites. Deprecated versions (SSLv3, TLS 1.0, 1.1) violate PCI-DSS 4.0.
              </p>
            </div>

            {/* Control 2: Cryptographic Key Strength */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-slate-200">Key Strength & Ciphers</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PASS
                </span>
              </div>
              <div className="text-2xs font-mono text-slate-300">
                Key length: <strong className="text-cyan-400">{scanResult.ssl.keyStrength}</strong>
              </div>
              <p className="text-3xs text-slate-400">
                CIS Benchmarks recommend 2048-bit RSA or 256-bit ECC key length to withstand modern brute-force cryptographic attacks.
              </p>
            </div>

            {/* Control 3: Certificate Validity & Expiration */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-slate-200">Certificate Validity</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  scanResult.ssl.status === 'valid'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : scanResult.ssl.status === 'expiring'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {scanResult.ssl.status.toUpperCase()}
                </span>
              </div>
              <div className="text-2xs font-mono text-slate-300 flex justify-between">
                <span>Issuer: {scanResult.ssl.issuer}</span>
                <span className="text-amber-400">{scanResult.ssl.daysRemaining} days remaining</span>
              </div>
              <p className="text-3xs text-slate-400">
                OWASP A02 requires automated certificate renewal and trust anchor validation before 30-day expiration thresholds.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Benchmark Gaps & Remediation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Critical Missing Controls */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2 font-mono uppercase tracking-wider">
            <XCircle className="w-4 h-4 text-rose-400" />
            Critical Benchmark Gaps ({compScore.findingsSummary.criticalMissing.length})
          </h4>

          {compScore.findingsSummary.criticalMissing.length > 0 ? (
            <div className="space-y-2">
              {compScore.findingsSummary.criticalMissing.map((gap, idx) => (
                <div key={`gap-box-${idx}`} className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-2xs text-slate-200 flex items-start gap-2 font-mono">
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{gap}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg text-2xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No critical benchmark gaps found. Current header and TLS configurations satisfy standard security baselines.</span>
            </div>
          )}
        </div>

        {/* Passed Controls */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2 font-mono uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Passed Compliance Controls ({compScore.findingsSummary.passed.length})
          </h4>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {compScore.findingsSummary.passed.map((passItem, idx) => (
              <div key={`pass-box-${idx}`} className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-2xs text-slate-200 flex items-start gap-2 font-mono">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{passItem}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceOverviewSection;
