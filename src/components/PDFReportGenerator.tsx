import React, { useState } from 'react';
import { Download, FileText, CheckCircle2 } from 'lucide-react';
import { ScanResult } from '../types';
import { generatePDFReport } from '../utils/pdfGenerator';

interface PDFReportGeneratorProps {
  data: ScanResult;
  variant?: 'button' | 'card';
  className?: string;
}

export const PDFReportGenerator: React.FC<PDFReportGeneratorProps> = ({
  data,
  variant = 'button',
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadPDF = () => {
    try {
      setIsGenerating(true);
      generatePDFReport(data);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (variant === 'card') {
    return (
      <div className={`bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              Formal Executive Audit Report
              <span className="text-3xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                PDF Export
              </span>
            </h4>
            <p className="text-2xs text-slate-400">
              Formatted document layout detailing NIST/OWASP benchmark gaps, ports, headers, and SSL key strength.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition disabled:opacity-50 shrink-0"
        >
          {downloaded ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Report Generated!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generating PDF...' : 'Download PDF Report'}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownloadPDF}
      disabled={isGenerating}
      className={`px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition disabled:opacity-50 ${className}`}
      title="Download formal executive audit report in PDF format"
    >
      {downloaded ? (
        <>
          <CheckCircle2 className="w-4 h-4" />
          <span>Downloaded!</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>{isGenerating ? 'Generating...' : 'Download PDF'}</span>
        </>
      )}
    </button>
  );
};

export default PDFReportGenerator;
