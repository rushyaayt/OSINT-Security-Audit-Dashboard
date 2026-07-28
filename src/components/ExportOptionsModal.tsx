import React, { useState, useMemo } from 'react';
import { X, Download, Copy, Check, FileCode, Database, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { ScanResult } from '../types';
import { generateSIEMJSON, generateSIEMCSV, downloadFile } from '../utils/siemExporter';
import { generatePDFReport } from '../utils/pdfGenerator';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ScanResult;
}

export const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [format, setFormat] = useState<'json' | 'csv' | 'splunk' | 'elastic' | 'pdf'>('json');
  const [copied, setCopied] = useState(false);

  // Field selection toggles
  const [selectedFields, setSelectedFields] = useState({
    targetInfo: true,
    riskAndCompliance: true,
    sslDetails: true,
    securityHeaders: true,
    openPorts: true,
    techStack: true,
    subdomains: true,
    dnsAndWhois: true,
  });

  const toggleField = (fieldKey: keyof typeof selectedFields) => {
    setSelectedFields(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const toggleAll = (enable: boolean) => {
    setSelectedFields({
      targetInfo: enable,
      riskAndCompliance: enable,
      sslDetails: enable,
      securityHeaders: enable,
      openPorts: enable,
      techStack: enable,
      subdomains: enable,
      dnsAndWhois: enable,
    });
  };

  // Filtered Scan Result based on user-selected fields
  const filteredData = useMemo(() => {
    const result: Partial<ScanResult> = { id: data.id };

    if (selectedFields.targetInfo) {
      result.target = data.target;
      result.ipAddress = data.ipAddress;
      result.timestamp = data.timestamp;
      result.location = data.location;
      result.summary = data.summary;
    }

    if (selectedFields.riskAndCompliance) {
      result.riskScore = data.riskScore;
      if (data.compliance_benchmark_score) {
        result.compliance_benchmark_score = data.compliance_benchmark_score;
      }
    }

    if (selectedFields.sslDetails) {
      result.ssl = data.ssl;
    }

    if (selectedFields.securityHeaders) {
      result.securityHeaders = data.securityHeaders;
    }

    if (selectedFields.openPorts) {
      result.openPorts = data.openPorts;
    }

    if (selectedFields.techStack) {
      result.techStack = data.techStack;
    }

    if (selectedFields.subdomains) {
      result.subdomains = data.subdomains;
    }

    if (selectedFields.dnsAndWhois) {
      result.dnsRecords = data.dnsRecords;
      result.whois = data.whois;
    }

    return result;
  }, [data, selectedFields]);

  // Generated preview content string based on active format
  const previewText = useMemo(() => {
    if (format === 'splunk') {
      return generateSIEMJSON(filteredData as ScanResult, 'splunk');
    }
    if (format === 'elastic') {
      return generateSIEMJSON(filteredData as ScanResult, 'elastic');
    }
    if (format === 'csv') {
      return generateSIEMCSV(filteredData as ScanResult, 'generic');
    }
    if (format === 'json') {
      return JSON.stringify(filteredData, null, 2);
    }
    return 'PDF Executive Security Report ready for generation.';
  }, [filteredData, format]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (format === 'pdf') return;
    navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const cleanTargetName = data.target.replace(/[^a-z0-9]/gi, '_');

    if (format === 'pdf') {
      generatePDFReport(data);
      return;
    }

    if (format === 'csv') {
      downloadFile(`${cleanTargetName}_audit_${Date.now()}.csv`, previewText, 'text/csv');
      return;
    }

    const mimeType = 'application/json';
    const extension = format === 'splunk' ? 'splunk.json' : format === 'elastic' ? 'elastic.json' : 'json';
    downloadFile(`${cleanTargetName}_${extension}`, previewText, mimeType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-100">Custom Export & SIEM Ingestion</h3>
              <p className="text-xs text-slate-400">
                Filter payload attributes and format for Splunk, Elastic, CSV, JSON or PDF
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Controls Column */}
          <div className="md:col-span-5 space-y-5 border-r border-slate-800/60 pr-0 md:pr-4">
            {/* Format Selector */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Export Target Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFormat('json')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    format === 'json'
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>Custom JSON</span>
                </button>

                <button
                  onClick={() => setFormat('csv')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    format === 'csv'
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Flattened CSV</span>
                </button>

                <button
                  onClick={() => setFormat('splunk')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    format === 'splunk'
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Splunk HEC</span>
                </button>

                <button
                  onClick={() => setFormat('elastic')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    format === 'elastic'
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Database className="w-4 h-4 text-teal-400" />
                  <span>Elastic ECS</span>
                </button>
              </div>

              <button
                onClick={() => setFormat('pdf')}
                className={`mt-2 w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  format === 'pdf'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Executive PDF Security Audit Report</span>
              </button>
            </div>

            {/* Field Ingestion Checkboxes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Select Payload Fields
                </label>
                <div className="flex space-x-2 text-[11px]">
                  <button
                    onClick={() => toggleAll(true)}
                    className="text-emerald-400 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={() => toggleAll(false)}
                    className="text-slate-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-xs">
                <label className="flex items-center space-x-2.5 cursor-pointer text-slate-300 hover:text-slate-100">
                  <input
                    type="checkbox"
                    checked={selectedFields.targetInfo}
                    onChange={() => toggleField('targetInfo')}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                  />
                  <span>Target Overview & Host Information</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer text-slate-300 hover:text-slate-100">
                  <input
                    type="checkbox"
                    checked={selectedFields.riskAndCompliance}
                    onChange={() => toggleField('riskAndCompliance')}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                  />
                  <span>Risk Score & NIST/OWASP Compliance Score</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer text-slate-300 hover:text-slate-100">
                  <input
                    type="checkbox"
                    checked={selectedFields.sslDetails}
                    onChange={() => toggleField('sslDetails')}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                  />
                  <span>SSL / TLS Certificate Audit Details</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer text-slate-300 hover:text-slate-100">
                  <input
                    type="checkbox"
                    checked={selectedFields.securityHeaders}
                    onChange={() => toggleField('securityHeaders')}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                  />
                  <span>HTTP Security Headers Array</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer text-slate-300 hover:text-slate-100">
                  <input
                    type="checkbox"
                    checked={selectedFields.openPorts}
                    onChange={() => toggleField('openPorts')}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                  />
                  <span>Network Open Ports & Services</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer text-slate-300 hover:text-slate-100">
                  <input
                    type="checkbox"
                    checked={selectedFields.techStack}
                    onChange={() => toggleField('techStack')}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                  />
                  <span>Technology Stack Fingerprints</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer text-slate-300 hover:text-slate-100">
                  <input
                    type="checkbox"
                    checked={selectedFields.subdomains}
                    onChange={() => toggleField('subdomains')}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                  />
                  <span>Enumerated Subdomains</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer text-slate-300 hover:text-slate-100">
                  <input
                    type="checkbox"
                    checked={selectedFields.dnsAndWhois}
                    onChange={() => toggleField('dnsAndWhois')}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                  />
                  <span>DNS Records & Passive WHOIS Data</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Preview Column */}
          <div className="md:col-span-7 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Payload Live Preview ({format.toUpperCase()})
              </label>
              {format !== 'pdf' && (
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Payload</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 p-3 font-mono text-[11px] text-slate-300 overflow-auto max-h-[380px] leading-relaxed">
              {format === 'pdf' ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
                  <ShieldAlert className="w-12 h-12 text-rose-400/80 mb-1 animate-pulse" />
                  <p className="font-semibold text-slate-200">PDF Report Ready for Download</p>
                  <p className="text-xs max-w-xs text-slate-400">
                    Generates a formal multi-page executive security audit document featuring overall score badge, OWASP/NIST benchmarks, header details, and port topology.
                  </p>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-all">{previewText}</pre>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <div className="text-xs text-slate-400">
            Target: <span className="font-mono text-slate-200 font-semibold">{data.target}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Download {format.toUpperCase()} Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
