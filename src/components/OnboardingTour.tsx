import React, { useState } from 'react';
import { X, Sparkles, Shield, ArrowRight, ArrowLeft, CheckCircle2, Layers, GitCompare, BarChart3, Database, Calendar } from 'lucide-react';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBulkScan?: () => void;
  onOpenDiffView?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onOpenBulkScan,
  onOpenDiffView
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to OSINT Recon & Security Auditor",
      icon: <Shield className="w-6 h-6 text-emerald-400" />,
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            This enterprise OSINT platform performs non-intrusive passive reconnaissance, security header audits, SSL socket inspection, and compliance benchmarking across target domains and subnets.
          </p>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Key Capabilities</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>Passive HTTP Security Header & SSL Certificate Inspection</li>
              <li>NIST SP 800-53 & OWASP Top 10 Benchmark Scoring</li>
              <li>Network Port Exposure Mapping & Vulnerability Heatmap</li>
              <li>Historical Scan Diff Comparison & Custom SIEM Exports</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "1. Single & Bulk Batch Target Scanner",
      icon: <Layers className="w-6 h-6 text-indigo-400" />,
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Audit individual domain names, IP addresses, or paste multi-line domain batch lists to run parallel reconnaissance across entire subnets.
          </p>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-2 font-mono text-[11px] text-slate-400">
            <span className="text-indigo-400 font-sans font-semibold text-xs block">Bulk Scan Input Formats:</span>
            <p>example.com</p>
            <p>api.github.com</p>
            <p>104.21.45.101</p>
          </div>
        </div>
      )
    },
    {
      title: "2. NIST & OWASP Compliance Benchmarks",
      icon: <BarChart3 className="w-6 h-6 text-amber-400" />,
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Every scan automatically calculates a <strong className="text-slate-100">Compliance Benchmark Score (0-100%)</strong> and assigns an overall Grade (A+ to F).
          </p>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-2 text-slate-300">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-amber-400">Framework Coverage:</span>
              <span className="text-[10px] bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded">NIST SP 800-53</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Evaluates HSTS enforcement (SC-8), Content Security Policy strictness (SC-28), TLS certificate validity (SC-13), and unencrypted database port exposure.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "3. Historical Scan Diff View",
      icon: <GitCompare className="w-6 h-6 text-indigo-400" />,
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Track vulnerability remediation over time! Select any two historical audit snapshots to visually inspect deltas in open ports, security headers, and risk scores.
          </p>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-rose-400">- Closed Port 3306</span>
            <span className="text-emerald-400">+ Added HSTS Header</span>
          </div>
        </div>
      )
    },
    {
      title: "4. Custom SIEM Exports & PDF Reports",
      icon: <Database className="w-6 h-6 text-teal-400" />,
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Export scan payloads with tailored field selections formatted specifically for Splunk HTTP Event Collector (HEC), Elasticsearch Common Schema (ECS), CSV, or formal Executive PDF Reports.
          </p>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-slate-400 text-[11px]">
            Includes instant payload previewing and field toggling for seamless SOC integration.
          </div>
        </div>
      )
    },
    {
      title: "5. Scheduled Audits & Email Alerts",
      icon: <Calendar className="w-6 h-6 text-purple-400" />,
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Configure automated hourly, daily, or weekly cron-style recurring audits and receive immediate email or webhook notifications when a critical security header is missing or SSL is expiring.
          </p>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-slate-300 text-xs font-medium">
            You're ready to start auditing! Click "Finish Tour" below to begin.
          </div>
        </div>
      )
    }
  ];

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full shadow-2xl text-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              {step.icon}
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 block">
                Auditor Quick Tour ({currentStep + 1} of {steps.length})
              </span>
              <h3 className="font-semibold text-base text-slate-100">{step.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 min-h-[220px]">
          {step.content}
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="px-6 py-2 bg-slate-950/50 flex space-x-1.5">
          {steps.map((_, idx) => (
            <div
              key={`tour-dot-${idx}`}
              className={`h-1 flex-1 rounded-full transition-colors ${
                idx === currentStep
                  ? 'bg-emerald-400'
                  : idx < currentStep
                  ? 'bg-emerald-500/40'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 font-medium transition-colors"
          >
            Skip Tour
          </button>

          <div className="flex items-center space-x-3">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
            >
              <span>{currentStep === steps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
