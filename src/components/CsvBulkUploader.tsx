import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, Zap, FileText } from 'lucide-react';

interface CsvBulkUploaderProps {
  onRunBulkScan: (targets: string[]) => void;
  isScanning?: boolean;
}

export const CsvBulkUploader: React.FC<CsvBulkUploaderProps> = ({
  onRunBulkScan,
  isScanning = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedTargets, setParsedTargets] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to sanitize and validate domain/IP string
  const sanitizeTarget = (raw: string): string | null => {
    let cleaned = raw.trim().toLowerCase();
    // Ignore common CSV headers
    if (!cleaned || ['domain', 'domains', 'target', 'targets', 'host', 'hostname', 'url', 'ip', 'ipaddress', 'id', 'name', 'status', 'site'].includes(cleaned)) {
      return null;
    }
    // Remove protocol prefixes
    cleaned = cleaned.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
    // Remove port numbers if attached
    cleaned = cleaned.replace(/:\d+$/, '');
    
    // Basic domain/IP regex sanity check
    const domainOrIpRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (domainOrIpRegex.test(cleaned)) {
      return cleaned;
    }
    return null;
  };

  const processFile = (file: File) => {
    if (!file) return;

    setFileName(file.name);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setParseError('The uploaded file is empty.');
          return;
        }

        // Split by lines and commas/semicolons
        const rawTokens = text.split(/[\r\n,;\t]+/);
        const extractedSet = new Set<string>();

        rawTokens.forEach(token => {
          const cleaned = sanitizeTarget(token);
          if (cleaned) {
            extractedSet.add(cleaned);
          }
        });

        const targetList = Array.from(extractedSet);

        if (targetList.length === 0) {
          setParseError('No valid domain names or IP addresses could be parsed from the file.');
          setParsedTargets([]);
        } else {
          setParsedTargets(targetList);
        }
      } catch (err) {
        console.error('CSV Parsing Error:', err);
        setParseError('Failed to parse file. Please ensure it is a valid CSV or plain text file.');
      }
    };

    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setParsedTargets([]);
    setFileName(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTriggerScan = () => {
    if (parsedTargets.length > 0 && onRunBulkScan) {
      onRunBulkScan(parsedTargets);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt,.log"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drag & Drop Upload Container */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10'
            : parsedTargets.length > 0
            ? 'border-emerald-500/50 bg-emerald-950/20'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className={`p-3 rounded-xl ${
            parsedTargets.length > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
          }`}>
            <FileSpreadsheet className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-200 block">
              {fileName ? `File: ${fileName}` : 'Upload CSV / Text File for Bulk Target Scan'}
            </span>
            <span className="text-2xs text-slate-400 block mt-0.5">
              Drag & drop a <code className="text-indigo-300 font-mono">.csv</code> or <code className="text-indigo-300 font-mono">.txt</code> domain list, or click to browse
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-lg text-2xs text-slate-300 border border-slate-700 mt-2">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Select CSV File</span>
          </div>
        </div>
      </div>

      {/* Parse Error Alert */}
      {parseError && (
        <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Extracted Domains Preview List */}
      {parsedTargets.length > 0 && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Parsed Target Domains ({parsedTargets.length}):</span>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="text-2xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear List
            </button>
          </div>

          {/* Targets Pill Badges */}
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 font-mono text-2xs">
            {parsedTargets.map((target, idx) => (
              <span
                key={`csv-target-${idx}`}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 flex items-center gap-1"
              >
                <span className="text-emerald-400 font-bold">•</span>
                <span>{target}</span>
              </span>
            ))}
          </div>

          {/* Trigger Scan Button */}
          <div className="pt-2 border-t border-slate-800/80 flex justify-end">
            <button
              type="button"
              onClick={handleTriggerScan}
              disabled={isScanning}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>Execute Bulk Scan on {parsedTargets.length} Domains</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
