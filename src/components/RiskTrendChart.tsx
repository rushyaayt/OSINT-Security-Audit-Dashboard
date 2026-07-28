import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, ShieldAlert, BarChart3, Clock, AlertTriangle } from 'lucide-react';
import { ScanResult, ScanHistoryItem } from '../types';

interface RiskTrendChartProps {
  currentScan?: ScanResult;
  history: ScanHistoryItem[];
  selectedDomain?: string;
  onSelectDomain?: (domain: string) => void;
}

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({
  currentScan,
  history,
  selectedDomain: initialDomain,
  onSelectDomain
}) => {
  // Determine available unique domains in history + current scan
  const allDomains = useMemo(() => {
    const set = new Set<string>();
    if (currentScan?.target) set.add(currentScan.target.toLowerCase());
    history.forEach(item => {
      if (item.target) set.add(item.target.toLowerCase());
    });
    return Array.from(set);
  }, [currentScan, history]);

  const [domain, setDomain] = useState<string>(
    initialDomain || (currentScan?.target ? currentScan.target.toLowerCase() : allDomains[0] || 'example.com')
  );

  const activeDomain = domain.toLowerCase();

  // Handle Domain Selection change
  const handleDomainChange = (newDomain: string) => {
    setDomain(newDomain);
    if (onSelectDomain) onSelectDomain(newDomain);
  };

  // Extract all historical scan entries for the active domain
  const chartData = useMemo(() => {
    const list: { id: string; timestamp: string; dateFormatted: string; timeFormatted: string; riskScore: number; target: string }[] = [];

    // Map history items
    history.forEach((h) => {
      if (h.target.toLowerCase() === activeDomain) {
        const d = new Date(h.timestamp);
        list.push({
          id: h.id,
          timestamp: h.timestamp,
          dateFormatted: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          timeFormatted: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          riskScore: h.riskScore,
          target: h.target,
        });
      }
    });

    // Check if currentScan matches activeDomain and is not already in list by ID
    if (currentScan && currentScan.target.toLowerCase() === activeDomain) {
      if (!list.some(item => item.id === currentScan.id)) {
        const d = new Date(currentScan.timestamp);
        list.push({
          id: currentScan.id,
          timestamp: currentScan.timestamp,
          dateFormatted: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          timeFormatted: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          riskScore: currentScan.riskScore,
          target: currentScan.target,
        });
      }
    }

    // Sort chronologically ascending
    list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return list;
  }, [history, currentScan, activeDomain]);

  // Compute Posture Trend Metrics
  const trendAnalysis = useMemo(() => {
    if (chartData.length < 2) {
      const singleScore = chartData[0]?.riskScore ?? currentScan?.riskScore ?? 0;
      return {
        status: 'insufficient_data',
        delta: 0,
        minScore: singleScore,
        maxScore: singleScore,
        avgScore: singleScore,
        message: 'Single scan recorded. Perform additional scans over time to generate a trend baseline.',
      };
    }

    const firstScore = chartData[0].riskScore;
    const latestScore = chartData[chartData.length - 1].riskScore;
    const delta = latestScore - firstScore;

    const scores = chartData.map((d) => d.riskScore);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    let status: 'worsening' | 'improving' | 'stable' = 'stable';
    if (delta > 0) status = 'worsening';
    else if (delta < 0) status = 'improving';

    return {
      status,
      delta,
      minScore,
      maxScore,
      avgScore,
      firstScore,
      latestScore,
    };
  }, [chartData, currentScan]);

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
      {/* Top Header & Domain Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Risk Score Trend & Historical Posture
              <span className="text-3xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                {chartData.length} Scan Snapshots
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Audits risk score variance over time to detect worsening security postures
            </p>
          </div>
        </div>

        {/* Domain Switcher Dropdown */}
        <div className="flex items-center space-x-2">
          <label htmlFor="select-domain-trend" className="text-2xs font-mono text-slate-400">Target Domain:</label>
          <select
            id="select-domain-trend"
            value={activeDomain}
            onChange={(e) => handleDomainChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {allDomains.map((d) => (
              <option key={`trend-domain-opt-${d}`} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Posture Trend Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
        {/* Trend Indicator */}
        <div className={`p-3 rounded-xl border flex items-center space-x-3 ${
          trendAnalysis.status === 'worsening'
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            : trendAnalysis.status === 'improving'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}>
          <div className="p-2 rounded-lg bg-slate-950/60">
            {trendAnalysis.status === 'worsening' ? (
              <TrendingUp className="w-5 h-5 text-rose-400 animate-pulse" />
            ) : trendAnalysis.status === 'improving' ? (
              <TrendingDown className="w-5 h-5 text-emerald-400" />
            ) : (
              <Minus className="w-5 h-5 text-indigo-400" />
            )}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Security Posture
            </span>
            <span className="font-bold text-xs">
              {trendAnalysis.status === 'worsening' && (
                <span className="text-rose-400 font-extrabold flex items-center gap-1">
                  WORSENING (+{trendAnalysis.delta} pts)
                </span>
              )}
              {trendAnalysis.status === 'improving' && (
                <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                  IMPROVING ({trendAnalysis.delta} pts)
                </span>
              )}
              {trendAnalysis.status === 'stable' && (
                <span className="text-indigo-300 font-bold">STABLE POSTURE</span>
              )}
              {trendAnalysis.status === 'insufficient_data' && (
                <span className="text-slate-400">BASELINE ESTABLISHED</span>
              )}
            </span>
          </div>
        </div>

        {/* Min Risk Score */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] uppercase text-slate-400 block">Lowest Risk Recorded</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
            {trendAnalysis.minScore} / 100
          </div>
        </div>

        {/* Max Risk Score */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] uppercase text-slate-400 block">Peak Risk Recorded</span>
          <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
            {trendAnalysis.maxScore} / 100
          </div>
        </div>

        {/* Average Risk Score */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] uppercase text-slate-400 block">Historical Average Risk</span>
          <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
            {trendAnalysis.avgScore} / 100
          </div>
        </div>
      </div>

      {/* Recharts Line Chart */}
      <div className="h-64 w-full bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 pt-4">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <Clock className="w-6 h-6 mb-2 text-slate-600" />
            No historical data found for {activeDomain}. Run multiple scans to render a trend line.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="dateFormatted"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                stroke="#334155"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                stroke="#334155"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono space-y-1">
                        <div className="text-indigo-400 font-bold">{dataPoint.target}</div>
                        <div className="text-slate-400 text-2xs">
                          {dataPoint.dateFormatted} at {dataPoint.timeFormatted}
                        </div>
                        <div className="flex items-center space-x-2 pt-1 border-t border-slate-800">
                          <span className="text-slate-300">Risk Score:</span>
                          <span className={`font-bold ${
                            dataPoint.riskScore > 60
                              ? 'text-rose-400'
                              : dataPoint.riskScore > 30
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}>
                            {dataPoint.riskScore} / 100
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={60} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'High Risk Threshold (60+)', fill: '#f43f5e', fontSize: 10 }} />
              <ReferenceLine y={30} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Medium Risk Threshold (30+)', fill: '#f59e0b', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="riskScore"
                name="Risk Exposure Score"
                stroke={trendAnalysis.status === 'worsening' ? '#f43f5e' : '#6366f1'}
                strokeWidth={3}
                dot={{ r: 5, fill: '#818cf8', stroke: '#0f172a', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#f43f5e' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {trendAnalysis.status === 'worsening' && (
        <div className="bg-rose-950/30 border border-rose-500/30 p-3 rounded-lg text-xs text-rose-300 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>Auditor Warning:</strong> Security posture for <code className="font-mono">{activeDomain}</code> has degraded across recent scans (+{trendAnalysis.delta} pts risk). Review new open ports or missing HTTP security headers.
          </span>
        </div>
      )}
    </div>
  );
};
