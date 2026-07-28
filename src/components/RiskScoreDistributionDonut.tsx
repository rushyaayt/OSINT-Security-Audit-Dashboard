import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp, BarChart2, Layers, Filter } from 'lucide-react';
import { ScanResult, ScanHistoryItem } from '../types';

interface RiskScoreDistributionDonutProps {
  history: ScanHistoryItem[];
  currentScan?: ScanResult | null;
}

interface TierData {
  name: string;
  key: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  percentage: number;
  color: string;
  range: string;
  description: string;
}

export const RiskScoreDistributionDonut: React.FC<RiskScoreDistributionDonutProps> = ({
  history,
  currentScan
}) => {
  const [targetFilter, setTargetFilter] = useState<string>('all');

  // Consolidate unique scan items (history + currentScan)
  const allScans = useMemo(() => {
    const map = new Map<string, { id: string; target: string; riskScore: number; timestamp: string }>();

    history.forEach(item => {
      map.set(item.id, {
        id: item.id,
        target: item.target,
        riskScore: item.riskScore,
        timestamp: item.timestamp
      });
    });

    if (currentScan && currentScan.id) {
      if (!map.has(currentScan.id)) {
        map.set(currentScan.id, {
          id: currentScan.id,
          target: currentScan.target,
          riskScore: currentScan.riskScore,
          timestamp: currentScan.timestamp
        });
      }
    }

    return Array.from(map.values());
  }, [history, currentScan]);

  // Unique domains list for filter dropdown
  const uniqueDomains = useMemo(() => {
    const set = new Set<string>();
    allScans.forEach(s => {
      if (s.target) set.add(s.target.toLowerCase());
    });
    return Array.from(set);
  }, [allScans]);

  // Filtered scans based on user selection
  const filteredScans = useMemo(() => {
    if (targetFilter === 'all') return allScans;
    return allScans.filter(s => s.target.toLowerCase() === targetFilter.toLowerCase());
  }, [allScans, targetFilter]);

  // Distribution calculations
  const distributionData = useMemo<TierData[]>(() => {
    let lowCount = 0;
    let medCount = 0;
    let highCount = 0;
    let critCount = 0;

    filteredScans.forEach(s => {
      const score = s.riskScore;
      if (score < 30) lowCount++;
      else if (score < 60) medCount++;
      else if (score < 80) highCount++;
      else critCount++;
    });

    const total = filteredScans.length || 1;

    return [
      {
        name: 'Low Risk',
        key: 'low',
        count: lowCount,
        percentage: Math.round((lowCount / total) * 100),
        color: '#10b981', // Emerald
        range: '0 - 29',
        description: 'Secure configuration with minimal attack vectors'
      },
      {
        name: 'Medium Risk',
        key: 'medium',
        count: medCount,
        percentage: Math.round((medCount / total) * 100),
        color: '#f59e0b', // Amber
        range: '30 - 59',
        description: 'Moderate exposure or missing security headers'
      },
      {
        name: 'High Risk',
        key: 'high',
        count: highCount,
        percentage: Math.round((highCount / total) * 100),
        color: '#f97316', // Orange
        range: '60 - 79',
        description: 'Significant vulnerabilities requiring remediation'
      },
      {
        name: 'Critical Risk',
        key: 'critical',
        count: critCount,
        percentage: Math.round((critCount / total) * 100),
        color: '#ef4444', // Red
        range: '80 - 100',
        description: 'Severe exposure, open dangerous ports or expired TLS'
      }
    ];
  }, [filteredScans]);

  // Metric Insights
  const stats = useMemo(() => {
    if (filteredScans.length === 0) {
      return { total: 0, avgRisk: 0, highestRisk: 0, lowestRisk: 0 };
    }

    const total = filteredScans.length;
    const sumRisk = filteredScans.reduce((acc, curr) => acc + curr.riskScore, 0);
    const avgRisk = Math.round(sumRisk / total);
    const highestRisk = Math.max(...filteredScans.map(s => s.riskScore));
    const lowestRisk = Math.min(...filteredScans.map(s => s.riskScore));

    return { total, avgRisk, highestRisk, lowestRisk };
  }, [filteredScans]);

  // Custom Recharts Donut Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: TierData = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl font-mono text-xs space-y-1 z-50">
          <div className="flex items-center gap-2 font-bold" style={{ color: data.color }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            {data.name} ({data.range})
          </div>
          <div className="text-slate-200">
            Scans: <strong className="text-white">{data.count}</strong> ({data.percentage}% of total)
          </div>
          <div className="text-3xs text-slate-400 max-w-xs">{data.description}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="risk-score-distribution-section" className="bg-slate-950 border border-slate-800/90 rounded-2xl p-5 md:p-6 shadow-2xl space-y-5">
      {/* Header and Domain Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xs uppercase font-mono font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Security Risk Intelligence
            </span>
            <span className="text-3xs font-mono text-slate-500">Historical Distribution</span>
          </div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mt-1 font-mono">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            Scan Risk Score Distribution Breakdown
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Aggregated audit risk score frequencies across all recorded target scans.
          </p>
        </div>

        {/* Filter Dropdown */}
        {uniqueDomains.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Target:</span>
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">
                All Targets ({allScans.length} scans)
              </option>
              {uniqueDomains.map(domain => (
                <option key={domain} value={domain} className="bg-slate-900 text-slate-200">
                  {domain}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {allScans.length === 0 ? (
        <div className="py-10 text-center space-y-2 text-slate-500 font-mono text-xs">
          <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
          <p>No scan history recorded yet to plot risk distribution.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Donut Chart Container */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[240px]">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="count"
                  stroke="#090d16"
                  strokeWidth={2}
                >
                  {distributionData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Central Donut Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-2xl font-extrabold font-mono text-slate-100 tracking-tight">
                {stats.avgRisk}
              </span>
              <span className="text-3xs uppercase font-mono tracking-wider text-slate-400 font-medium">
                Avg Risk Score
              </span>
            </div>
          </div>

          {/* Tier Legend Cards */}
          <div className="lg:col-span-7 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {distributionData.map((tier) => (
                <div
                  key={tier.key}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 space-y-1 transition hover:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold font-mono text-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tier.color }} />
                      {tier.name}
                    </div>
                    <span
                      className="text-2xs font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{ color: tier.color, backgroundColor: `${tier.color}15` }}
                    >
                      {tier.percentage}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-2xs font-mono text-slate-400">
                    <span>Range: {tier.range}</span>
                    <strong className="text-slate-200 text-xs">{tier.count} scan{tier.count !== 1 ? 's' : ''}</strong>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${tier.percentage}%`,
                        backgroundColor: tier.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Insights Banner */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Total Scans Evaluated: <strong className="text-white">{stats.total}</strong>
                </span>
              </div>

              <div className="flex items-center gap-4 text-2xs text-slate-400">
                <span>
                  Min Risk: <strong className="text-emerald-400">{stats.lowestRisk}</strong>
                </span>
                <span>
                  Max Risk: <strong className="text-rose-400">{stats.highestRisk}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskScoreDistributionDonut;
