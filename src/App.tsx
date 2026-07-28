import React, { useState, useEffect } from 'react';
import { ScanResult, ScanRequest, ScanHistoryItem, ScheduledTask, EmailAlertConfig, AlertLogItem } from './types';
import { MainDashboard } from './components/MainDashboard';

const STORAGE_KEY_HISTORY = 'osint_audit_history_v1';
const STORAGE_KEY_SCHEDULES = 'osint_scheduled_tasks_v1';
const STORAGE_KEY_ALERT_CONFIG = 'osint_email_alert_config_v1';
const STORAGE_KEY_ALERT_LOGS = 'osint_alert_logs_v1';

export default function App() {
  const [targetInput, setTargetInput] = useState('example.com');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // History State
  const [history, setHistory] = useState<ScanHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load history from localStorage', e);
    }
    return [];
  });

  // Scheduled Tasks State
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHEDULES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load scheduled tasks', e);
    }
    return [
      {
        id: 'task-1',
        target: 'example.com',
        frequency: 'daily',
        options: {
          enumerateSubdomains: true,
          checkSSL: true,
          auditHeaders: true,
          checkPorts: true,
          detectTechStack: true,
          dnsLookup: true,
          whoisPassive: true,
        },
        nextRun: new Date(Date.now() + 86400000).toLocaleString(),
        enabled: true,
        alertOnCritical: true,
        notifyEmail: 'secops-alerts@company.com'
      },
      {
        id: 'task-2',
        target: 'api.github.com',
        frequency: 'weekly',
        options: {
          enumerateSubdomains: true,
          checkSSL: true,
          auditHeaders: true,
          checkPorts: true,
          detectTechStack: true,
          dnsLookup: true,
          whoisPassive: true,
        },
        nextRun: new Date(Date.now() + 86400000 * 7).toLocaleString(),
        enabled: true,
        alertOnCritical: true,
        notifyEmail: 'audit@devops.org'
      }
    ];
  });

  // Email Notification Config State
  const [alertConfig, setAlertConfig] = useState<EmailAlertConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ALERT_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load alert config', e);
    }
    return {
      recipientEmail: 'secops-alerts@company.com',
      enableAlerts: true,
      triggerThresholdScore: 40,
      alertOnCriticalHeaderMissing: true,
      alertOnSslExpiring: true
    };
  });

  // Email Alert Audit Logs State
  const [alertLogs, setAlertLogs] = useState<AlertLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ALERT_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load alert logs', e);
    }
    return [];
  });

  const [options, setOptions] = useState<ScanRequest['options']>({
    enumerateSubdomains: true,
    checkSSL: true,
    auditHeaders: true,
    checkPorts: true,
    detectTechStack: true,
    dnsLookup: true,
    whoisPassive: true,
  });

  // LocalStorage Sync Effects
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) { console.error(e); }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(scheduledTasks));
    } catch (e) { console.error(e); }
  }, [scheduledTasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ALERT_CONFIG, JSON.stringify(alertConfig));
    } catch (e) { console.error(e); }
  }, [alertConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ALERT_LOGS, JSON.stringify(alertLogs));
    } catch (e) { console.error(e); }
  }, [alertLogs]);

  // Evaluates email notification triggers for a completed scan
  const evaluateScanForAlerts = async (result: ScanResult) => {
    if (!alertConfig.enableAlerts || !alertConfig.recipientEmail) return;

    let triggerReason = '';
    const hstsFail = result.securityHeaders.some(h => h.header.includes('Strict-Transport-Security') && h.status === 'fail');
    const sslExp = result.ssl.daysRemaining < 15 || result.ssl.status === 'expired';

    if (result.riskScore >= alertConfig.triggerThresholdScore) {
      triggerReason = `Risk score ${result.riskScore} exceeded threshold (${alertConfig.triggerThresholdScore})`;
    } else if (alertConfig.alertOnCriticalHeaderMissing && hstsFail) {
      triggerReason = `Critical HSTS Security Header is missing`;
    } else if (alertConfig.alertOnSslExpiring && sslExp) {
      triggerReason = `SSL/TLS certificate expiring soon (${result.ssl.daysRemaining} days remaining)`;
    }

    if (triggerReason) {
      try {
        await fetch('/api/send-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail: alertConfig.recipientEmail,
            target: result.target,
            riskScore: result.riskScore,
            triggerReason
          })
        });

        const newLog: AlertLogItem = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          target: result.target,
          riskScore: result.riskScore,
          triggerReason,
          recipientEmail: alertConfig.recipientEmail,
          status: 'sent'
        };

        setAlertLogs(prev => [newLog, ...prev]);
      } catch (err) {
        console.error('Failed to trigger alert notification:', err);
      }
    }
  };

  const handleRunScan = async (e?: React.FormEvent, customTarget?: string) => {
    if (e) e.preventDefault();
    const queryTarget = customTarget || targetInput;
    if (!queryTarget.trim() || isScanning) return;

    setIsScanning(true);
    setScanProgress(10);
    setScanStep('Validating and sanitizing target inputs...');

    try {
      await new Promise(r => setTimeout(r, 350));
      setScanProgress(30);
      setScanStep('Resolving DNS topology & querying passive WHOIS...');

      await new Promise(r => setTimeout(r, 350));
      setScanProgress(60);
      setScanStep('Auditing HTTP security response headers & SSL certificate health...');

      await new Promise(r => setTimeout(r, 350));
      setScanProgress(85);
      setScanStep('Fingerprinting technology stack & mapping ports...');

      let response: Response;
      try {
        response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: queryTarget,
            options,
          }),
        });
      } catch (networkErr: any) {
        console.warn('[ScanEngine] Transient network error on scan API fetch. Executing auto-retry (1/1)...', networkErr);
        setScanStep('Transient network error encountered. Executing auto-retry (1/1)...');
        await new Promise(r => setTimeout(r, 600));
        response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: queryTarget,
            options,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Scan failed: ${errorData.error || 'Server error'}`);
        setIsScanning(false);
        return;
      }

      const data: ScanResult = await response.json();
      setScanProgress(100);
      setScanStep('Scan completed!');

      await new Promise(r => setTimeout(r, 150));
      setScanResult(data);

      // Add to Scan History
      const historyItem: ScanHistoryItem = {
        id: data.id,
        target: data.target,
        timestamp: data.timestamp,
        riskScore: data.riskScore,
        ipAddress: data.ipAddress,
        result: data,
      };

      setHistory(prev => [historyItem, ...prev.filter(h => h.id !== data.id)]);

      // Evaluate Email Alerts
      evaluateScanForAlerts(data);

    } catch (err) {
      console.error('Failed to trigger scan:', err);
      alert('Unable to reach scan API service. Please check network connection.');
    } finally {
      setIsScanning(false);
    }
  };

  // Bulk Scan Handler for comma-separated or multi-line domain input
  const handleRunBulkScan = async (targetsList: string[]) => {
    if (!targetsList || targetsList.length === 0 || isScanning) return;

    setIsScanning(true);
    setScanProgress(15);
    setScanStep(`Executing bulk batch audit scan for ${targetsList.length} domains...`);

    try {
      await new Promise(r => setTimeout(r, 500));
      setScanProgress(50);
      setScanStep('Parallel auditing headers, SSL sockets & subdomains across target batch...');

      const response = await fetch('/api/bulk-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: targetsList })
      });

      if (!response.ok) {
        alert('Bulk scan execution failed');
        setIsScanning(false);
        return;
      }

      const data = await response.json();
      const results: ScanResult[] = data.results || [];

      if (results.length > 0) {
        setScanProgress(100);
        setScanStep(`Batch scan completed for ${results.length} targets!`);

        // Load primary result
        const primaryResult = results[0];
        setScanResult(primaryResult);

        // Add all to history
        const newHistoryItems: ScanHistoryItem[] = results.map(res => ({
          id: res.id,
          target: res.target,
          timestamp: res.timestamp,
          riskScore: res.riskScore,
          ipAddress: res.ipAddress,
          result: res
        }));

        setHistory(prev => [...newHistoryItems, ...prev]);

        // Evaluate alerts for the highest risk result
        const highestRisk = [...results].sort((a, b) => b.riskScore - a.riskScore)[0];
        if (highestRisk) {
          evaluateScanForAlerts(highestRisk);
        }
      } else {
        alert('No valid targets could be scanned in bulk batch.');
      }
    } catch (err) {
      console.error('Bulk scan failed:', err);
      alert('Failed to execute bulk batch scan.');
    } finally {
      setIsScanning(false);
    }
  };

  // Scheduled Task Management Helpers
  const handleAddScheduledTask = (newTask: Omit<ScheduledTask, 'id' | 'nextRun'>) => {
    const item: ScheduledTask = {
      ...newTask,
      id: `task-${Date.now()}`,
      nextRun: new Date(Date.now() + 86400000).toLocaleString()
    };
    setScheduledTasks(prev => [item, ...prev]);
  };

  const handleToggleScheduledTask = (id: string) => {
    setScheduledTasks(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  };

  const handleDeleteScheduledTask = (id: string) => {
    setScheduledTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleRunScheduledTaskNow = (task: ScheduledTask) => {
    setTargetInput(task.target);
    handleRunScan(undefined, task.target);
  };

  // Test Alert Helper
  const handleTestSendAlert = (email: string) => {
    fetch('/api/send-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientEmail: email,
        target: targetInput || 'example.com',
        riskScore: scanResult?.riskScore || 65,
        triggerReason: 'Manual Test Alert Dispatch requested by Auditor'
      })
    });

    const newLog: AlertLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      target: targetInput || 'example.com',
      riskScore: scanResult?.riskScore || 65,
      triggerReason: 'Manual Test Alert Dispatch',
      recipientEmail: email,
      status: 'simulated'
    };

    setAlertLogs(prev => [newLog, ...prev]);
  };

  const handleSelectScan = (item: ScanHistoryItem) => {
    setTargetInput(item.target);
    setScanResult(item.result);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAllHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <MainDashboard
      scanResult={scanResult}
      isScanning={isScanning}
      scanProgress={scanProgress}
      scanStep={scanStep}
      targetInput={targetInput}
      setTargetInput={setTargetInput}
      onRunScan={handleRunScan}
      onRunBulkScan={handleRunBulkScan}
      options={options}
      setOptions={setOptions}
      history={history}
      onSelectScan={handleSelectScan}
      onDeleteHistoryItem={handleDeleteHistoryItem}
      onClearAllHistory={handleClearAllHistory}
      scheduledTasks={scheduledTasks}
      onAddScheduledTask={handleAddScheduledTask}
      onToggleScheduledTask={handleToggleScheduledTask}
      onDeleteScheduledTask={handleDeleteScheduledTask}
      onRunScheduledTaskNow={handleRunScheduledTaskNow}
      alertConfig={alertConfig}
      onSaveAlertConfig={setAlertConfig}
      alertLogs={alertLogs}
      onTestSendAlert={handleTestSendAlert}
    />
  );
}


