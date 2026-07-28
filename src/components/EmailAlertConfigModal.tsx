import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  Send, 
  CheckCircle2, 
  AlertOctagon, 
  Mail, 
  ShieldAlert, 
  Flame, 
  Info, 
  Clock,
  History
} from 'lucide-react';
import { EmailAlertConfig, AlertLogItem, ScanResult } from '../types';

interface EmailAlertConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  alertConfig: EmailAlertConfig;
  onSaveConfig: (config: EmailAlertConfig) => void;
  alertLogs: AlertLogItem[];
  onTestSendAlert: (email: string) => void;
  currentScanResult?: ScanResult | null;
}

export function EmailAlertConfigModal({
  isOpen,
  onClose,
  alertConfig,
  onSaveConfig,
  alertLogs,
  onTestSendAlert,
  currentScanResult
}: EmailAlertConfigModalProps) {
  const [recipientEmail, setRecipientEmail] = useState(alertConfig.recipientEmail || 'secops-alerts@company.com');
  const [enableAlerts, setEnableAlerts] = useState(alertConfig.enableAlerts);
  const [thresholdScore, setThresholdScore] = useState(alertConfig.triggerThresholdScore || 40);
  const [alertOnCriticalHeader, setAlertOnCriticalHeader] = useState(alertConfig.alertOnCriticalHeaderMissing);
  const [alertOnSslExpiring, setAlertOnSslExpiring] = useState(alertConfig.alertOnSslExpiring);
  const [webhookUrl, setWebhookUrl] = useState(alertConfig.webhookUrl || '');

  const [activeTab, setActiveTab] = useState<'settings' | 'logs'>('settings');
  const [testSentMessage, setTestSentMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      recipientEmail: recipientEmail.trim(),
      enableAlerts,
      triggerThresholdScore: Number(thresholdScore),
      alertOnCriticalHeaderMissing: alertOnCriticalHeader,
      alertOnSslExpiring: alertOnSslExpiring,
      webhookUrl: webhookUrl.trim() || undefined
    });
    onClose();
  };

  const handleTriggerTest = () => {
    if (!recipientEmail) return;
    onTestSendAlert(recipientEmail);
    setTestSentMessage(`Test alert dispatched to ${recipientEmail}`);
    setTimeout(() => setTestSentMessage(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Critical Vulnerability Email Notification Center</h2>
              <p className="text-xs text-slate-400">Automated triggers for high risk score drops & missing defensive headers</p>
            </div>
          </div>

          <button
            id="btn-close-email-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-5 pt-3 border-b border-slate-800 flex items-center gap-4 text-xs font-mono bg-slate-900/20">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 font-semibold border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Notification Settings
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Alert Audit Log</span>
            <span className="px-1.5 py-0.2 bg-slate-800 rounded text-3xs">{alertLogs.length}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'settings' ? (
            <form onSubmit={handleSave} className="space-y-4">
              
              {/* Main Enable Switch */}
              <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Automated Email Notifications</span>
                  <span className="text-2xs text-slate-400">Triggers when passive scans detect risk spikes or expired SSL</span>
                </div>
                <input
                  id="toggle-enable-email-alerts"
                  type="checkbox"
                  checked={enableAlerts}
                  onChange={(e) => setEnableAlerts(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded bg-slate-950 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Recipient Email */}
              <div>
                <label className="block text-2xs font-mono text-slate-400 mb-1">Primary Recipient Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    id="input-alert-email-recipient"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="security-alerts@domain.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Threshold Risk Score Slider */}
              <div className="p-3.5 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-2xs font-mono">
                  <span className="text-slate-300 font-semibold">Trigger Risk Score Threshold</span>
                  <span className="text-rose-400 font-bold px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded">
                    Score &ge; {thresholdScore}
                  </span>
                </div>
                <input
                  id="slider-risk-threshold"
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={thresholdScore}
                  onChange={(e) => setThresholdScore(Number(e.target.value))}
                  className="w-full accent-rose-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
                <div className="flex justify-between text-3xs font-mono text-slate-500">
                  <span>10 (Low Sensitivity)</span>
                  <span>40 (Recommended)</span>
                  <span>90 (Critical Only)</span>
                </div>
              </div>

              {/* Specific Trigger Conditions */}
              <div className="space-y-2 text-2xs font-mono text-slate-300">
                <span className="text-slate-400 uppercase font-semibold block">Specific Security Triggers</span>
                
                <label className="flex items-center gap-2 p-2.5 bg-slate-900/40 border border-slate-800/60 rounded-lg cursor-pointer">
                  <input
                    id="chk-alert-critical-headers"
                    type="checkbox"
                    checked={alertOnCriticalHeader}
                    onChange={(e) => setAlertOnCriticalHeader(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-indigo-500"
                  />
                  <span>Alert if Strict-Transport-Security (HSTS) or CSP is missing</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-slate-900/40 border border-slate-800/60 rounded-lg cursor-pointer">
                  <input
                    id="chk-alert-ssl-expiring"
                    type="checkbox"
                    checked={alertOnSslExpiring}
                    onChange={(e) => setAlertOnSslExpiring(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-indigo-500"
                  />
                  <span>Alert if SSL/TLS Certificate expires in under 15 days</span>
                </label>
              </div>

              {/* Webhook integration */}
              <div>
                <label className="block text-2xs font-mono text-slate-400 mb-1">SIEM / Slack Webhook URL (Optional)</label>
                <input
                  id="input-webhook-url"
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100"
                />
              </div>

              {/* Test Notification Action */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                <button
                  id="btn-test-alert-dispatch"
                  type="button"
                  onClick={handleTriggerTest}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-2xs font-mono rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5 text-indigo-400" />
                  Dispatch Test Alert Email
                </button>

                {testSentMessage && (
                  <span className="text-2xs font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {testSentMessage}
                  </span>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg transition"
                >
                  Cancel
                </button>

                <button
                  id="btn-save-email-config"
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white rounded-lg shadow-lg shadow-rose-600/20 transition"
                >
                  Save Notification Rules
                </button>
              </div>
            </form>
          ) : (
            /* Audit Log View */
            <div className="space-y-3">
              <h3 className="text-2xs font-mono uppercase text-slate-400">Historical Dispatched Security Alerts</h3>

              {alertLogs.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/30 border border-slate-800 rounded-xl space-y-2">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">No email notifications sent yet</p>
                  <p className="text-2xs text-slate-500">Alert triggers will be recorded here when scans exceed the risk threshold.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {alertLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1 font-mono text-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-rose-400 font-bold">{log.target}</span>
                        <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-slate-300">{log.triggerReason}</div>
                      <div className="flex items-center justify-between text-3xs text-slate-400 pt-1 border-t border-slate-800/60">
                        <span>Recipient: {log.recipientEmail}</span>
                        <span className="text-emerald-400 uppercase font-semibold">[{log.status}]</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
