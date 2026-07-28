import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Globe, 
  Lock, 
  Server, 
  Cpu, 
  Terminal, 
  Download, 
  RefreshCw, 
  Search, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  Layers,
  Database,
  Radio,
  Clock,
  Key,
  Copy,
  Check,
  Zap,
  Info,
  History,
  Activity,
  FileSpreadsheet,
  FileCode,
  List,
  Upload,
  Bell,
  Calendar,
  Sparkles,
  Share2,
  GitCompare,
  HelpCircle
} from 'lucide-react';
import { ScanResult, ScanRequest, SecurityHeader, SIEMExportPayload, ScanHistoryItem, ScheduledTask, EmailAlertConfig, AlertLogItem } from '../types';
import { generatePDFReport } from '../utils/pdfGenerator';
import { ScanHistorySidebar } from './ScanHistorySidebar';
import { VulnerabilityHeatmap } from './VulnerabilityHeatmap';
import { TaskSchedulerModal } from './TaskSchedulerModal';
import { EmailAlertConfigModal } from './EmailAlertConfigModal';
import { ExportOptionsModal } from './ExportOptionsModal';
import { ScanDiffViewModal } from './ScanDiffViewModal';
import { OnboardingTour } from './OnboardingTour';
import { ComplianceReportModal } from './ComplianceReportModal';
import { RiskTrendChart } from './RiskTrendChart';
import { CsvBulkUploader } from './CsvBulkUploader';
import { ComplianceRadialGauge } from './ComplianceRadialGauge';
import { PDFReportGenerator } from './PDFReportGenerator';
import { ComplianceOverviewSection } from './ComplianceOverviewSection';
import { TopologyNodeLinkDiagram } from './TopologyNodeLinkDiagram';
import { RiskScoreDistributionDonut } from './RiskScoreDistributionDonut';
import { RemediationSuggestionsPanel } from './RemediationSuggestionsPanel';
import { computeComplianceScore } from '../utils/complianceCalculator';
import { downloadFile, generateSIEMCSV, generateSIEMJSON } from '../utils/siemExporter';
import { Tooltip } from 'react-tooltip';

interface AppContentProps {
  scanResult: ScanResult | null;
  isScanning: boolean;
  scanProgress: number;
  scanStep: string;
  targetInput: string;
  setTargetInput: (val: string) => void;
  onRunScan: (e?: React.FormEvent) => void;
  onRunBulkScan?: (targetsList: string[]) => void;
  options: ScanRequest['options'];
  setOptions: React.Dispatch<React.SetStateAction<ScanRequest['options']>>;
  history: ScanHistoryItem[];
  onSelectScan: (item: ScanHistoryItem) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearAllHistory: () => void;
  scheduledTasks?: ScheduledTask[];
  onAddScheduledTask?: (task: Omit<ScheduledTask, 'id' | 'nextRun'>) => void;
  onToggleScheduledTask?: (id: string) => void;
  onDeleteScheduledTask?: (id: string) => void;
  onRunScheduledTaskNow?: (task: ScheduledTask) => void;
  alertConfig?: EmailAlertConfig;
  onSaveAlertConfig?: (config: EmailAlertConfig) => void;
  alertLogs?: AlertLogItem[];
  onTestSendAlert?: (email: string) => void;
}

export function MainDashboard({
  scanResult,
  isScanning,
  scanProgress,
  scanStep,
  targetInput,
  setTargetInput,
  onRunScan,
  onRunBulkScan,
  options,
  setOptions,
  history,
  onSelectScan,
  onDeleteHistoryItem,
  onClearAllHistory,
  scheduledTasks = [],
  onAddScheduledTask = () => {},
  onToggleScheduledTask = () => {},
  onDeleteScheduledTask = () => {},
  onRunScheduledTaskNow = () => {},
  alertConfig = {
    recipientEmail: 'secops-alerts@company.com',
    enableAlerts: true,
    triggerThresholdScore: 40,
    alertOnCriticalHeaderMissing: true,
    alertOnSslExpiring: true
  },
  onSaveAlertConfig = () => {},
  alertLogs = [],
  onTestSendAlert = () => {},
}: AppContentProps) {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'compliance' | 'heatmap' | 'topology' | 'subdomains' | 'ssl' | 'headers' | 'tech' | 'siem'>('overview');
  const [siemFormat, setSiemFormat] = React.useState<'splunk' | 'elastic' | 'cef' | 'json'>('splunk');
  const [siemCode, setSiemCode] = React.useState<string>('');
  const [isExportingSiem, setIsExportingSiem] = React.useState(false);
  const [copiedSiem, setCopiedSiem] = React.useState(false);
  
  // Modals & Drawers state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);

  // Input Mode state ('single' vs 'bulk')
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single');
  const [bulkTargetsText, setBulkTargetsText] = useState('example.com, github.com, cloudflare.com');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Preset Domain Trigger
  const handleQuickPreset = (domain: string) => {
    setTargetInput(domain);
  };

  // Handle File Upload for Bulk Scan Target List (.txt / .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsedList = content.split(/[\r\n,;]+/).map(line => line.trim()).filter(Boolean);
        if (parsedList.length > 0) {
          setBulkTargetsText(parsedList.join(', '));
          setInputMode('bulk');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTargetsText.trim() || !onRunBulkScan) return;
    const list = bulkTargetsText.split(/[\r\n,;]+/).map(t => t.trim()).filter(Boolean);
    if (list.length > 0) {
      onRunBulkScan(list);
    }
  };

  // Fetch SIEM Export formatted string when SIEM tab or format changes
  React.useEffect(() => {
    if (activeTab === 'siem' && scanResult) {
      setIsExportingSiem(true);
      fetch('/api/siem-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: siemFormat, data: scanResult }),
      })
        .then((res) => res.json())
        .then((resData) => {
          setSiemCode(resData.formatted || '');
        })
        .catch((err) => console.error('SIEM export error', err))
        .finally(() => setIsExportingSiem(false));
    }
  }, [activeTab, siemFormat, scanResult]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSiem(true);
    setTimeout(() => setCopiedSiem(false), 2000);
  };

  const handleDownloadSiemJSON = () => {
    if (!scanResult) return;
    const jsonStr = generateSIEMJSON(scanResult, siemFormat === 'cef' ? 'json' : siemFormat);
    downloadFile(`osint-${scanResult.target}-${siemFormat}.json`, jsonStr, 'application/json');
  };

  const handleDownloadSiemCSV = () => {
    if (!scanResult) return;
    const csvStr = generateSIEMCSV(scanResult, siemFormat === 'elastic' ? 'elastic' : 'splunk');
    downloadFile(`osint-${scanResult.target}-siem.csv`, csvStr, 'text/csv');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Scan History Sidebar Drawer */}
      <ScanHistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectScan={onSelectScan}
        onDeleteHistoryItem={onDeleteHistoryItem}
        onClearAllHistory={onClearAllHistory}
        currentActiveId={scanResult?.id}
      />

      {/* Task Scheduler Modal */}
      <TaskSchedulerModal
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        tasks={scheduledTasks}
        onAddTask={onAddScheduledTask}
        onToggleTask={onToggleScheduledTask}
        onDeleteTask={onDeleteScheduledTask}
        onRunTaskNow={onRunScheduledTaskNow}
        defaultTarget={targetInput}
        defaultOptions={options}
      />

      {/* Email Alert Config Modal */}
      <EmailAlertConfigModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        alertConfig={alertConfig}
        onSaveConfig={onSaveAlertConfig}
        alertLogs={alertLogs}
        onTestSendAlert={onTestSendAlert}
        currentScanResult={scanResult}
      />

      {/* Export Options Modal */}
      {scanResult && (
        <ExportOptionsModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          data={scanResult}
        />
      )}

      {/* Scan Diff View Modal */}
      <ScanDiffViewModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        history={history}
        initialScanB={scanResult || undefined}
      />

      {/* Onboarding Auditor Quick Tour */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />

      {/* Formal Executive Compliance Report Modal */}
      {scanResult && (
        <ComplianceReportModal
          isOpen={isComplianceModalOpen}
          onClose={() => setIsComplianceModalOpen(false)}
          data={scanResult}
        />
      )}

      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-2">
                OSINT Audit Suite
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                  v1.4 Active
                </span>
              </h1>
              <p className="text-xs text-slate-400">Automated Reconnaissance & Security Inspection</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Auditor Tour Trigger */}
            <button
              id="btn-open-tour"
              onClick={() => setIsTourOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-2 rounded-lg transition"
              title="Launch Guided Auditor Tour"
            >
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Quick Tour</span>
            </button>

            {/* Scan Diff Comparison Button */}
            <button
              id="btn-open-diff"
              onClick={() => setIsDiffModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 px-3 py-2 rounded-lg transition"
              data-tooltip-id="global-tooltip"
              data-tooltip-content="Compare two historical scans side-by-side to view header, port, and risk score deltas."
            >
              <GitCompare className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Compare Scans</span>
            </button>

            {/* Task Scheduler Modal Trigger */}
            <button
              id="btn-open-scheduler"
              onClick={() => setIsSchedulerOpen(true)}
              className="inline-flex items-center gap-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg transition"
              data-tooltip-id="global-tooltip"
              data-tooltip-content="Manage recurring automated audit tasks."
            >
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Schedule</span>
              {scheduledTasks.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-500 text-white font-mono text-3xs">
                  {scheduledTasks.length}
                </span>
              )}
            </button>

            {/* Email Alert Config Modal Trigger */}
            <button
              id="btn-open-alerts"
              onClick={() => setIsAlertModalOpen(true)}
              className="inline-flex items-center gap-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg transition relative"
              data-tooltip-id="global-tooltip"
              data-tooltip-content="Configure email alerts for high-risk findings or missing headers."
            >
              <Bell className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Alerts</span>
              {alertConfig.enableAlerts && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1 animate-ping" />
              )}
            </button>

            {/* Scan History Button */}
            <button
              id="btn-open-history"
              onClick={() => setIsHistoryOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg transition relative"
              data-tooltip-id="global-tooltip"
              data-tooltip-content="History Sidebar: View, search, reload, or compare previous scan target audits."
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span>History</span>
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-300" />
              {history.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-500 text-white font-mono text-3xs">
                  {history.length}
                </span>
              )}
            </button>

            {scanResult && (
              <div className="flex items-center gap-1.5">
                {/* PDF Report Download Button Component */}
                <PDFReportGenerator data={scanResult} />

                {/* Formal Executive Compliance Report View Trigger */}
                <button
                  id="btn-open-compliance-report"
                  onClick={() => setIsComplianceModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-3 py-2 rounded-lg transition"
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content="Compliance Report: Generate a formal executive report with NIST/OWASP benchmark gap analyses."
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Compliance Report</span>
                </button>

                {/* Custom Export Options Modal Trigger */}
                <button
                  id="btn-export-options"
                  onClick={() => setIsExportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-2 rounded-lg transition"
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content="Scan Options / Export: Select custom fields to export to JSON, CSV, or SIEM format."
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Custom Export</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search & Scan Control Panel */}
        <section className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur space-y-4">
          
          {/* Input Mode Selector Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                Scan Mode:
                <span
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content="Bulk Input: Switch between single target scanning and CSV/text multi-target batch auditing."
                  className="cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-400" />
                </span>
              </span>
              <button
                type="button"
                onClick={() => setInputMode('single')}
                className={`px-3 py-1 rounded transition border ${
                  inputMode === 'single'
                    ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Single Domain / IP
              </button>
              <button
                type="button"
                onClick={() => setInputMode('bulk')}
                className={`px-3 py-1 rounded transition border flex items-center gap-1.5 ${
                  inputMode === 'bulk'
                    ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Bulk Batch Target Job
              </button>
            </div>

            {/* Hidden file upload input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.csv"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-2xs font-mono flex items-center gap-1.5 transition"
              title="Upload text or CSV file containing target domain list"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              Upload Domain List (.txt / .csv)
            </button>
          </div>

          {inputMode === 'single' ? (
            <form onSubmit={onRunScan} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    id="target-input-field"
                    type="text"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    placeholder="Enter target domain or IP (e.g., example.com, 104.21.45.101)"
                    disabled={isScanning}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                  />
                </div>

                <button
                  id="btn-start-scan"
                  type="submit"
                  disabled={isScanning || !targetInput.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition shadow-lg shadow-indigo-600/20"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Start Recon Scan
                    </>
                  )}
                </button>
              </div>

              {/* Config Checkboxes & Quick Presets */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-semibold text-slate-300 flex items-center gap-1">
                    Audits:
                    <span
                      data-tooltip-id="global-tooltip"
                      data-tooltip-content="Scan Options: Toggle specific audit modules (subdomains, SSL/TLS, HTTP headers, ports, tech stack)."
                      className="cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-400" />
                    </span>
                  </span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.enumerateSubdomains}
                      onChange={(e) => setOptions({ ...options, enumerateSubdomains: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    Subdomains
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.checkSSL}
                      onChange={(e) => setOptions({ ...options, checkSSL: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    SSL/TLS Check
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.auditHeaders}
                      onChange={(e) => setOptions({ ...options, auditHeaders: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    HTTP Headers
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.checkPorts}
                      onChange={(e) => setOptions({ ...options, checkPorts: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    Port Overview
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.detectTechStack}
                      onChange={(e) => setOptions({ ...options, detectTechStack: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    Tech Stack
                  </label>
                </div>

                {/* Sample Targets */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Quick Try:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('example.com')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono text-2xs"
                  >
                    example.com
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('github.com')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono text-2xs"
                  >
                    github.com
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('cloudflare.com')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono text-2xs"
                  >
                    cloudflare.com
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* BULK BATCH TARGET FORM & CSV FILE UPLOADER */
            <div className="space-y-5">
              {/* CSV & Text File Upload Drag & Drop Component */}
              <CsvBulkUploader
                onRunBulkScan={(targets) => {
                  if (onRunBulkScan) {
                    onRunBulkScan(targets);
                  }
                }}
                isScanning={isScanning}
              />

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-950 px-3 text-2xs font-mono text-slate-500 uppercase tracking-wider relative shrink-0">
                  Or Paste Domain Targets Manually
                </span>
              </div>

              <form onSubmit={handleExecuteBulkSubmit} className="space-y-3">
                <div>
                  <label className="block text-2xs font-mono text-slate-400 mb-1">
                    Enter comma-separated domains or one target per line (Subnets & Domain lists supported)
                  </label>
                  <textarea
                    id="textarea-bulk-targets"
                    value={bulkTargetsText}
                    onChange={(e) => setBulkTargetsText(e.target.value)}
                    rows={3}
                    placeholder="e.g. example.com, github.com, cloudflare.com, api.domain.org"
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-2xs font-mono text-slate-500">
                    Target Count: {bulkTargetsText.split(/[\r\n,;]+/).map(t=>t.trim()).filter(Boolean).length} domains
                  </span>

                  <button
                    id="btn-execute-bulk-job"
                    type="submit"
                    disabled={isScanning || !bulkTargetsText.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    Execute Bulk Batch Audit Scan
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ANIMATED PROGRESS BAR WITH GLOW & SHIMMER EFFECTS */}
          {isScanning && (
            <div className="mt-4 p-4 bg-slate-900/90 border border-indigo-500/30 rounded-xl space-y-3 relative overflow-hidden shadow-inner">
              
              {/* Subtle Glowing Pulse Background Accent */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl animate-pulse pointer-events-none" />

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-indigo-400 flex items-center gap-2 font-bold">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                  </span>
                  {scanStep}
                </span>
                <span className="text-indigo-300 font-bold font-mono">{scanProgress}%</span>
              </div>

              {/* Shimmering Animated Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-600 via-indigo-400 to-cyan-400 relative"
                  style={{ width: `${scanProgress}%` }}
                >
                  {/* Subtle Shimmer Animation Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-pulse" />
                </div>
              </div>

              {/* Stage Progress Checklist Indicator */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-3xs font-mono pt-1 text-slate-400 border-t border-slate-800/60">
                <div className={`flex items-center gap-1 ${scanProgress >= 25 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>1. Input Sanitization</span>
                </div>
                <div className={`flex items-center gap-1 ${scanProgress >= 50 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>2. DNS Topology</span>
                </div>
                <div className={`flex items-center gap-1 ${scanProgress >= 75 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>3. SSL & HTTP Headers</span>
                </div>
                <div className={`flex items-center gap-1 ${scanProgress >= 100 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>4. Tech Stack & Ports</span>
                </div>
              </div>

            </div>
          )}
        </section>

        {/* RESULTS SECTION */}
        {scanResult ? (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Target & IP */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xs font-mono text-slate-400 block uppercase">Target Host</span>
                  <span className="font-mono text-sm font-bold text-slate-100">{scanResult.target}</span>
                  <span className="text-3xs font-mono text-slate-500 block">IP: {scanResult.ipAddress}</span>
                </div>
              </div>

              {/* Passive Risk Score */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    scanResult.riskScore > 50 
                      ? 'bg-rose-500/10 text-rose-400' 
                      : scanResult.riskScore > 25 
                      ? 'bg-amber-500/10 text-amber-400' 
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xs font-mono text-slate-400 block uppercase">Passive Risk Score</span>
                    <span className="text-xs font-mono text-slate-400">0 (Safe) - 100 (Critical)</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-2xl font-bold font-mono ${
                    scanResult.riskScore > 50 
                      ? 'text-rose-400' 
                      : scanResult.riskScore > 25 
                      ? 'text-amber-400' 
                      : 'text-emerald-400'
                  }`}>
                    {scanResult.riskScore}
                  </span>
                  <span className="text-3xs font-mono text-slate-500 block">/ 100</span>
                </div>
              </div>

              {/* SSL Status */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xs font-mono text-slate-400 block uppercase">SSL Certificate</span>
                  <span className="font-mono text-xs font-bold text-slate-100 capitalize">{scanResult.ssl.status}</span>
                  <span className="text-3xs font-mono text-slate-500 block">{scanResult.ssl.daysRemaining} days remaining</span>
                </div>
              </div>

              {/* Subdomains & Headers Count */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xs font-mono text-slate-400 block uppercase">Discovered Assets</span>
                  <span className="font-mono text-xs font-bold text-slate-100">{scanResult.subdomains.length} Subdomains</span>
                  <span className="text-3xs font-mono text-slate-500 block">{scanResult.securityHeaders.length} Headers Audited</span>
                </div>
              </div>
            </div>

            {/* TAB NAVIGATION BAR */}
            <div className="border-b border-slate-800 flex items-center gap-2 overflow-x-auto pb-1">
              <button
                id="tab-overview"
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-4 h-4" />
                Executive Summary
              </button>

              <button
                id="tab-compliance"
                onClick={() => setActiveTab('compliance')}
                className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'compliance'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Compliance & Benchmarks
              </button>

              <button
                id="tab-heatmap"
                onClick={() => setActiveTab('heatmap')}
                className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'heatmap'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-4 h-4 text-rose-400" />
                Vulnerability Heatmap
              </button>

              <button
                id="tab-topology"
                onClick={() => setActiveTab('topology')}
                className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'topology'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Share2 className="w-4 h-4 text-cyan-400" />
                Attack Surface Topology (D3)
              </button>

              <button
                id="tab-subdomains"
                onClick={() => setActiveTab('subdomains')}
                className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'subdomains'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                Subdomains ({scanResult.subdomains.length})
              </button>

              <button
                id="tab-ssl"
                onClick={() => setActiveTab('ssl')}
                className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'ssl'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-4 h-4" />
                SSL / TLS Health
              </button>

              <button
                id="tab-headers"
                onClick={() => setActiveTab('headers')}
                className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'headers'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                HTTP Security Headers
              </button>

              <button
                id="tab-tech"
                onClick={() => setActiveTab('tech')}
                className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'tech'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-4 h-4" />
                Tech Stack & Ports
              </button>

              <button
                id="tab-siem"
                onClick={() => setActiveTab('siem')}
                className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'siem'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-4 h-4" />
                SIEM Event Ingestion
              </button>
            </div>

            {/* TAB CONTENT VIEWS */}
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Compliance Benchmark Score Card */}
                  {(() => {
                    const compScore = scanResult.compliance_benchmark_score || computeComplianceScore(
                      scanResult.securityHeaders,
                      scanResult.ssl,
                      scanResult.openPorts
                    );

                    return (
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg shrink-0">
                              <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                                Compliance & Benchmark Score
                                <span className="text-3xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                                  Grade {compScore.grade}
                                </span>
                              </h3>
                              <p className="text-xs text-slate-400">
                                Evaluated against NIST SP 800-53, OWASP Top 10, CIS Controls & PCI-DSS v4.0
                              </p>
                            </div>
                          </div>

                          {/* Radial Gauge Component */}
                          <ComplianceRadialGauge
                            score={compScore.overallScore}
                            grade={compScore.grade}
                            passedControls={compScore.passedControls}
                            totalControls={compScore.totalControls}
                          />
                        </div>

                        {/* Progress Bars for Individual Frameworks */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                            <div className="flex justify-between text-slate-400 text-[11px]">
                              <span>NIST SP 800-53</span>
                              <span className="text-slate-200 font-bold">{compScore.frameworkScores.nist}%</span>
                            </div>
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${compScore.frameworkScores.nist}%` }} />
                            </div>
                          </div>

                          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                            <div className="flex justify-between text-slate-400 text-[11px]">
                              <span>OWASP Top 10</span>
                              <span className="text-slate-200 font-bold">{compScore.frameworkScores.owasp}%</span>
                            </div>
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${compScore.frameworkScores.owasp}%` }} />
                            </div>
                          </div>

                          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                            <div className="flex justify-between text-slate-400 text-[11px]">
                              <span>CIS Benchmarks</span>
                              <span className="text-slate-200 font-bold">{compScore.frameworkScores.cis}%</span>
                            </div>
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${compScore.frameworkScores.cis}%` }} />
                            </div>
                          </div>

                          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                            <div className="flex justify-between text-slate-400 text-[11px]">
                              <span>PCI-DSS v4.0</span>
                              <span className="text-slate-200 font-bold">{compScore.frameworkScores.pciDss}%</span>
                            </div>
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${compScore.frameworkScores.pciDss}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Findings Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                          {compScore.findingsSummary.criticalMissing.length > 0 && (
                            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg space-y-1">
                              <span className="font-semibold text-rose-400 flex items-center space-x-1">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Critical Benchmark Gaps ({compScore.findingsSummary.criticalMissing.length})</span>
                              </span>
                              <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                                {compScore.findingsSummary.criticalMissing.map((item, idx) => (
                                  <li key={`gap-${idx}`}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg space-y-1">
                            <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Passed Control Baseline ({compScore.findingsSummary.passed.length})</span>
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                              {compScore.findingsSummary.passed.map((item, idx) => (
                                <li key={`pass-${idx}`}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Summary Box */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      Passive Inspection Executive Findings
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{scanResult.summary}</p>
                  </div>

                  {/* Context-Aware Audit Remediation Suggestions Panel */}
                  <RemediationSuggestionsPanel scanResult={scanResult} />

                  {/* Formal PDF Report Generator Card */}
                  <PDFReportGenerator data={scanResult} variant="card" />

                  {/* Historical Risk Score Trend Line Chart Component */}
                  <RiskTrendChart
                    currentScan={scanResult}
                    history={history}
                    selectedDomain={scanResult.target}
                  />

                  {/* Recharts Risk Score Distribution Donut Chart */}
                  <RiskScoreDistributionDonut
                    history={history}
                    currentScan={scanResult}
                  />

                  {/* DNS Topology Records */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 font-mono">
                      <Database className="w-4 h-4 text-cyan-400" />
                      Resolved DNS Infrastructure Records
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-3xs">
                          <tr>
                            <th className="py-2 px-3">Type</th>
                            <th className="py-2 px-3">Resolved Record / Host Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {scanResult.dnsRecords.map((rec, i) => (
                            <tr key={i} className="hover:bg-slate-900/50">
                              <td className="py-2 px-3 font-bold text-indigo-400">{rec.type}</td>
                              <td className="py-2 px-3 text-slate-300">{rec.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* WHOIS Panel */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-3 h-fit">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 font-mono">
                    <Radio className="w-4 h-4 text-purple-400" />
                    WHOIS Passive Metadata
                  </h3>
                  <div className="space-y-2 text-xs font-mono">
                    <div>
                      <span className="text-2xs text-slate-500 block">Registrar</span>
                      <span className="text-slate-300">{scanResult.whois.registrar || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-500 block">Organization</span>
                      <span className="text-slate-300">{scanResult.whois.orgName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-500 block">Creation / Expiration</span>
                      <span className="text-slate-300">{scanResult.whois.createdDate} to {scanResult.whois.expiresDate}</span>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-500 block">Name Servers</span>
                      <span className="text-slate-300">{scanResult.whois.nameServers?.join(', ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: COMPLIANCE & BENCHMARKS */}
            {activeTab === 'compliance' && (
              <ComplianceOverviewSection
                scanResult={scanResult}
                onOpenReportModal={() => setIsComplianceModalOpen(true)}
              />
            )}

            {/* TAB 2: VULNERABILITY HEATMAP */}
            {activeTab === 'heatmap' && (
              <VulnerabilityHeatmap scanResult={scanResult} />
            )}

            {/* TAB 2.5: TOPOLOGY MAP (D3 Node-Link Diagram) */}
            {activeTab === 'topology' && (
              <TopologyNodeLinkDiagram scanResult={scanResult} />
            )}

            {/* TAB 3: SUBDOMAINS */}
            {activeTab === 'subdomains' && (
              <div className="space-y-6">
                <TopologyNodeLinkDiagram scanResult={scanResult} height={420} />

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-200 font-mono">
                      Discovered Attack Surface Subdomains ({scanResult.subdomains.length})
                    </h3>
                    <span className="text-2xs font-mono text-slate-500">Source: CRT.sh CT Logs & Passive OSINT APIs</span>
                  </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-3xs border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Subdomain Host</th>
                        <th className="py-3 px-4">IP Address</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">OSINT Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {scanResult.subdomains.map((sub, i) => (
                        <tr key={i} className="hover:bg-slate-900/50">
                          <td className="py-2.5 px-4 text-indigo-300 font-bold">{sub.subdomain}</td>
                          <td className="py-2.5 px-4 text-slate-300">{sub.ip}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-3xs font-bold uppercase ${
                              sub.status === 'active' 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 text-2xs">{sub.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

            {/* TAB 4: SSL / TLS HEALTH */}
            {activeTab === 'ssl' && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4 font-mono">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-400" />
                    TLS / SSL Certificate Inspection
                  </h3>
                  <span className={`px-3 py-1 rounded text-2xs font-bold uppercase border ${
                    scanResult.ssl.status === 'valid'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}>
                    Status: {scanResult.ssl.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1">
                    <span className="text-2xs text-slate-500 block">Certificate Issuer</span>
                    <span className="text-slate-200 font-bold text-xs">{scanResult.ssl.issuer}</span>
                  </div>

                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1">
                    <span className="text-2xs text-slate-500 block">Valid Until</span>
                    <span className="text-slate-200 font-bold text-xs">{scanResult.ssl.validTo}</span>
                  </div>

                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1">
                    <span className="text-2xs text-slate-500 block">Protocol & Key Strength</span>
                    <span className="text-slate-200 font-bold text-xs">{scanResult.ssl.protocol} ({scanResult.ssl.keyStrength})</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1">
                  <span className="text-2xs text-slate-500 block">SHA-256 Fingerprint</span>
                  <span className="text-xs text-indigo-300 font-mono break-all">{scanResult.ssl.fingerprintSha256}</span>
                </div>
              </div>
            )}

            {/* TAB 5: SECURITY HEADERS */}
            {activeTab === 'headers' && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 font-mono">
                  HTTP Security Response Headers Audit
                </h3>

                <div className="space-y-3">
                  {scanResult.securityHeaders.map((hdr, i) => (
                    <div
                      key={i}
                      className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-200">{hdr.header}</span>
                        <span className={`px-2.5 py-0.5 rounded text-3xs font-bold uppercase font-mono ${
                          hdr.status === 'pass' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : hdr.status === 'warning'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {hdr.status}
                        </span>
                      </div>

                      <p className="text-2xs text-slate-400 font-sans">{hdr.explanation}</p>

                      <div className="p-2 bg-slate-950 border border-slate-800/80 rounded font-mono text-2xs text-slate-300 break-all">
                        Header Value: <span className="text-indigo-300">{hdr.value}</span>
                      </div>

                      {hdr.recommendation && (
                        <p className="text-2xs font-mono text-amber-400/90 pt-1">
                          Fix Recommendation: {hdr.recommendation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: TECH STACK & PORTS */}
            {activeTab === 'tech' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tech Fingerprints */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    Fingerprinted Technology Stack
                  </h3>

                  <div className="space-y-2.5">
                    {scanResult.techStack.map((tech, i) => (
                      <div key={i} className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between font-mono text-xs">
                        <div>
                          <span className="font-bold text-slate-100 block">{tech.name}</span>
                          <span className="text-3xs text-slate-400 font-sans">{tech.category} — {tech.description}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-3xs">
                          {tech.confidence}% Conf.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Open Ports Overview */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    Passive Network Port Overview
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 text-slate-400 uppercase text-3xs border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Port</th>
                          <th className="py-2.5 px-3">Service</th>
                          <th className="py-2.5 px-3">State</th>
                          <th className="py-2.5 px-3">Risk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {scanResult.openPorts.map((p, i) => (
                          <tr key={i} className="hover:bg-slate-900/50">
                            <td className="py-2 px-3 font-bold text-indigo-400">{p.port}/{p.protocol}</td>
                            <td className="py-2 px-3 text-slate-300">{p.service}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-3xs font-bold uppercase ${
                                p.status === 'open' 
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-2xs uppercase text-slate-400">{p.risk}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: SIEM EXPORT */}
            {activeTab === 'siem' && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4 font-mono">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      Splunk & Elastic Common Schema (ECS) Ingestion
                    </h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">
                      Formatted audit payloads structured for immediate ingestion into Splunk HEC or Elastic SIEM indexes.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-slate-400">Format:</label>
                    <select
                      id="siem-format-select"
                      value={siemFormat}
                      onChange={(e: any) => setSiemFormat(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-3 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="splunk">Splunk HEC JSON (osint:recon:v1)</option>
                      <option value="elastic">Elastic Common Schema (ECS JSON)</option>
                      <option value="cef">CEF (Common Event Format)</option>
                      <option value="json">Standard Raw JSON</option>
                    </select>

                    <button
                      id="btn-download-siem-json"
                      onClick={handleDownloadSiemJSON}
                      className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium rounded border border-emerald-500/30 flex items-center gap-1.5 transition"
                      title="Download formatted JSON file"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      Download JSON
                    </button>

                    <button
                      id="btn-download-siem-csv"
                      onClick={handleDownloadSiemCSV}
                      className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 text-xs font-medium rounded border border-cyan-500/30 flex items-center gap-1.5 transition"
                      title="Download CSV for SIEM indexers"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Download CSV
                    </button>

                    <button
                      id="btn-copy-siem"
                      onClick={() => copyToClipboard(siemCode)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 flex items-center gap-1.5 transition"
                    >
                      {copiedSiem ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSiem ? 'Copied Payload!' : 'Copy Code'}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-2xs text-indigo-300 font-mono overflow-x-auto max-h-96">
                    {isExportingSiem ? 'Formatting SIEM payload...' : siemCode}
                  </pre>
                </div>
              </div>
            )}

            {/* Bottom Overall Risk Distribution Donut Chart (for non-overview tabs) */}
            {activeTab !== 'overview' && (
              <div className="pt-4 border-t border-slate-800/80">
                <RiskScoreDistributionDonut
                  history={history}
                  currentScan={scanResult}
                />
              </div>
            )}
          </div>
        ) : (
          !isScanning && (
            <div className="py-16 text-center space-y-3 bg-slate-950/30 border border-slate-800/80 rounded-2xl">
              <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-slate-300">No Target Audited Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Enter an authorized domain or IP above and click <span className="text-indigo-400 font-mono">Start Recon Scan</span> or <span className="text-indigo-400 font-mono">Upload Domain List</span> to generate passive intelligence findings.
              </p>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-2xs text-slate-500 font-mono">
        OSINT Reconnaissance & Vulnerability Audit Engine • Authorized Defense Audits Only
      </footer>

      {/* Global Tooltip Component */}
      <Tooltip
        id="global-tooltip"
        style={{
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          fontSize: '12px',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '6px 12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }}
      />
    </div>
  );
}
