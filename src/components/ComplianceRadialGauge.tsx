import React from 'react';

interface ComplianceRadialGaugeProps {
  score: number; // 0 to 100
  grade?: string;
  size?: number; // Size in px, default 120
  strokeWidth?: number; // default 10
  passedControls?: number;
  totalControls?: number;
}

export const ComplianceRadialGauge: React.FC<ComplianceRadialGaugeProps> = ({
  score,
  grade = 'B',
  size = 110,
  strokeWidth = 9,
  passedControls,
  totalControls,
}) => {
  // Clamp score between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  // Color Coding:
  // Green (emerald) if score >= 80
  // Yellow/Amber if score >= 60 && < 80
  // Red (rose) if score < 60
  let strokeColor = '#10b981'; // emerald-500
  let textColor = 'text-emerald-400';
  let badgeBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
  let alignmentLabel = 'High Alignment (NIST / OWASP)';

  if (clampedScore < 60) {
    strokeColor = '#f43f5e'; // rose-500
    textColor = 'text-rose-400';
    badgeBg = 'bg-rose-500/10 border-rose-500/30 text-rose-300';
    alignmentLabel = 'Critical Gaps Detected';
  } else if (clampedScore < 80) {
    strokeColor = '#f59e0b'; // amber-500
    textColor = 'text-amber-400';
    badgeBg = 'bg-amber-500/10 border-amber-500/30 text-amber-300';
    alignmentLabel = 'Moderate Baseline Alignment';
  }

  // SVG Geometry calculations
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex items-center space-x-4 bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-inner">
      {/* Radial Gauge SVG */}
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Inner Radial Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-xl font-extrabold font-mono tracking-tight ${textColor}`}>
            {clampedScore}%
          </span>
          <span className="text-[9px] uppercase font-mono text-slate-400 tracking-wider">
            Alignment
          </span>
        </div>
      </div>

      {/* Side Details */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${badgeBg}`}>
            Grade {grade}
          </span>
          {passedControls !== undefined && totalControls !== undefined && (
            <span className="text-2xs font-mono text-slate-400">
              {passedControls}/{totalControls} Controls
            </span>
          )}
        </div>
        <div className="text-xs font-semibold text-slate-200">
          Compliance Benchmark Score
        </div>
        <div className="text-3xs text-slate-400">
          {alignmentLabel}
        </div>
      </div>
    </div>
  );
};

export default ComplianceRadialGauge;
