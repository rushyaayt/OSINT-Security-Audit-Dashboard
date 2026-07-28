import React, { useState } from 'react';
import { 
  Clock, 
  X, 
  Plus, 
  Trash2, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  BellRing,
  Globe,
  Sliders,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { ScheduledTask, ScanRequest } from '../types';

interface TaskSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: ScheduledTask[];
  onAddTask: (task: Omit<ScheduledTask, 'id' | 'nextRun'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onRunTaskNow: (task: ScheduledTask) => void;
  defaultTarget?: string;
  defaultOptions?: ScanRequest['options'];
}

export function TaskSchedulerModal({
  isOpen,
  onClose,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onRunTaskNow,
  defaultTarget = '',
  defaultOptions
}: TaskSchedulerModalProps) {
  const [targetInput, setTargetInput] = useState(defaultTarget || 'example.com');
  const [frequency, setFrequency] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('daily');
  const [alertOnCritical, setAlertOnCritical] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState('secops-alerts@company.com');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput.trim()) return;

    onAddTask({
      target: targetInput.trim().toLowerCase(),
      frequency,
      enabled: true,
      alertOnCritical,
      notifyEmail: notifyEmail.trim() || undefined,
      options: defaultOptions || {
        enumerateSubdomains: true,
        checkSSL: true,
        auditHeaders: true,
        checkPorts: true,
        detectTechStack: true,
        dnsLookup: true,
        whoisPassive: true
      }
    });

    setTargetInput('');
  };

  const calculateNextRunText = (freq: string) => {
    const now = new Date();
    if (freq === 'hourly') now.setHours(now.getHours() + 1);
    else if (freq === 'daily') now.setDate(now.getDate() + 1);
    else if (freq === 'weekly') now.setDate(now.getDate() + 7);
    else if (freq === 'monthly') now.setMonth(now.getMonth() + 1);
    return now.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Recurring Audit Task Scheduler</h2>
              <p className="text-xs text-slate-400">Automate passive recon scans for critical domain attack surfaces</p>
            </div>
          </div>

          <button
            id="btn-close-scheduler-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Add New Schedule Form */}
          <form onSubmit={handleCreate} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <Plus className="w-4 h-4" /> Schedule New Recurring Recon Job
              </span>
              <span className="text-2xs text-slate-400 font-mono">Auto-dispatches alerts</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-mono text-slate-400 mb-1">Target Domain / Host</label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    id="input-schedule-target"
                    type="text"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    placeholder="e.g. api.company.com"
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-mono text-slate-400 mb-1">Scan Interval</label>
                <select
                  id="select-schedule-frequency"
                  value={frequency}
                  onChange={(e: any) => setFrequency(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="hourly">Every Hour (High Priority)</option>
                  <option value="daily">Daily Audit (Recommended)</option>
                  <option value="weekly">Weekly Compliance Check</option>
                  <option value="monthly">Monthly Asset Review</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-mono text-slate-400 mb-1">Notification Email</label>
                <input
                  id="input-schedule-email"
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="secops@domain.com"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <label className="flex items-center gap-2 text-2xs text-slate-300 font-mono cursor-pointer">
                  <input
                    id="checkbox-schedule-alert-critical"
                    type="checkbox"
                    checked={alertOnCritical}
                    onChange={(e) => setAlertOnCritical(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span>Dispatch Email on Critical Risk (&gt;40)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                id="btn-submit-schedule-job"
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                Activate Task Schedule
              </button>
            </div>
          </form>

          {/* Active Scheduled Tasks List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Active Scheduled Jobs ({tasks.length})</span>
            </h3>

            {tasks.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/30 border border-slate-800/80 rounded-xl space-y-2">
                <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">No recurring tasks scheduled yet</p>
                <p className="text-2xs text-slate-500">Configure a domain above to start continuous security monitoring.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3.5 border rounded-xl flex items-center justify-between gap-3 transition ${
                      t.enabled
                        ? 'bg-slate-900/80 border-slate-800'
                        : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-300">{t.target}</span>
                        <span className="px-2 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-3xs font-mono uppercase">
                          {t.frequency}
                        </span>
                        {t.alertOnCritical && (
                          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-3xs font-mono flex items-center gap-1">
                            <BellRing className="w-2.5 h-2.5" /> Email Alert
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-3xs font-mono text-slate-400">
                        <span>Next Run: {t.nextRun}</span>
                        {t.lastRun && <span>• Last Run: {t.lastRun}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRunTaskNow(t)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded border border-slate-700 flex items-center gap-1 transition"
                        title="Run audit scan immediately"
                      >
                        <Play className="w-3 h-3 text-emerald-400" />
                        Run Now
                      </button>

                      <button
                        onClick={() => onToggleTask(t.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 rounded transition"
                        title={t.enabled ? 'Pause schedule' : 'Enable schedule'}
                      >
                        {t.enabled ? (
                          <ToggleRight className="w-6 h-6 text-indigo-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-600" />
                        )}
                      </button>

                      <button
                        onClick={() => onDeleteTask(t.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                        title="Delete schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex justify-between items-center text-2xs font-mono text-slate-400">
          <span>Continuous monitoring active in session engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
