import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Database,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Layers,
  Copy,
  Check,
  Download,
  Trash2,
  Eye,
  Info,
  ShieldCheck,
  Wifi,
  ExternalLink,
  Code2,
  FileJson,
  Cpu,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { MedicalCase } from '../types';
import {
  executeDatabaseCliCommand,
  CommandResult,
  inspectImageStorage,
  reseedFirestoreWithBaselineCases,
  clearLocalCasesCache,
  testFirestoreConnection,
  getDiagnosticState
} from '../services/casesService';
import { isDataOrBlobUrl } from '../lib/imageUtils';

interface DatabaseTerminalProps {
  cases: MedicalCase[];
  onRefreshCases?: () => Promise<void>;
}

export const DatabaseTerminal: React.FC<DatabaseTerminalProps> = ({
  cases,
  onRefreshCases,
}) => {
  const [inputCommand, setInputCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [outputLogs, setOutputLogs] = useState<CommandResult[]>([
    {
      command: 'init',
      timestamp: new Date().toLocaleTimeString(),
      format: 'text',
      output: [
        'RadMed Cloud Firestore CLI Shell v2.4.0 (Initialized)',
        'Connected to Firestore Collection: "cases"',
        `Active Documents Loaded: ${cases.length} cases`,
        'Deterministic Ordering Engine: ACTIVE',
        'Type "help" or click one of the quick actions below to query the database.',
      ].join('\n'),
    },
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || 'case-cxr-001');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeSubView, setActiveSubView] = useState<'terminal' | 'inspector' | 'architecture'>('terminal');

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const imageStats = inspectImageStorage(cases);
  const diag = getDiagnosticState();

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputLogs]);

  const handleRunCommand = async (cmdToRun?: string) => {
    const target = cmdToRun !== undefined ? cmdToRun : inputCommand;
    if (!target.trim()) return;

    setIsExecuting(true);
    const newHistory = [target, ...commandHistory.filter(c => c !== target)].slice(0, 30);
    setCommandHistory(newHistory);
    setHistoryIndex(-1);

    if (target.trim().toLowerCase() === 'clear' || target.trim().toLowerCase() === 'cls') {
      setOutputLogs([]);
      setInputCommand('');
      setIsExecuting(false);
      return;
    }

    try {
      const result = await executeDatabaseCliCommand(target, cases);
      if (result.output === '__CLEAR_SCREEN__') {
        setOutputLogs([]);
      } else {
        setOutputLogs(prev => [...prev, result]);
      }

      // If command was reseed or clear-cache, trigger refresh
      if (target.trim().toLowerCase() === 'reseed' || target.trim().toLowerCase() === 'clear-cache') {
        if (onRefreshCases) {
          await onRefreshCases();
        }
      }
    } catch (e: any) {
      setOutputLogs(prev => [
        ...prev,
        {
          command: target,
          timestamp: new Date().toLocaleTimeString(),
          isError: true,
          output: `Command Execution Error: ${e?.message || e}`,
        },
      ]);
    } finally {
      setIsExecuting(false);
      setInputCommand('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRunCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIndex = historyIndex + 1 < commandHistory.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIndex);
        setInputCommand(commandHistory[nextIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const prevIndex = historyIndex - 1;
        setHistoryIndex(prevIndex);
        setInputCommand(commandHistory[prevIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputCommand('');
      }
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const selectedCase = cases.find(c => c.id === selectedCaseId) || cases[0];

  return (
    <div className="space-y-6">
      {/* Header Banner & Sub-View Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <TerminalIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Database Terminal & Storage Architecture
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Live interactive CLI shell for querying Firestore documents, inspecting image storage, and locking deterministic order.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60 self-stretch md:self-auto">
          <button
            onClick={() => setActiveSubView('terminal')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubView === 'terminal'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" /> Interactive CLI
          </button>
          <button
            onClick={() => setActiveSubView('inspector')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubView === 'inspector'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Document Inspector
          </button>
          <button
            onClick={() => setActiveSubView('architecture')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubView === 'architecture'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" /> Storage Blueprint
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Database ID</span>
            <Database className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-sm font-black text-slate-900 dark:text-white mt-1 truncate">
            {diag.databaseId}
          </p>
          <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3 h-3 inline" /> Collection: /cases
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Deterministic Cases</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
            {cases.length} <span className="text-xs font-normal text-slate-400">cases</span>
          </p>
          <span className="text-[10px] text-blue-500 font-medium">
            10 CXR + 10 Head CT Canonical
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Image Storage</span>
            <HardDrive className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
            {imageStats.cdnUrlCount} <span className="text-xs font-normal text-slate-400">CDN</span> / {imageStats.dataUriCount} <span className="text-xs font-normal text-slate-400">URI</span>
          </p>
          <span className="text-[10px] text-purple-500 font-medium">
            +{imageStats.totalGalleryImages} gallery scans
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Order Stability</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Locked 1..{cases.length}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">
            No reload flapping
          </span>
        </div>
      </div>

      {/* --- SUBVIEW 1: INTERACTIVE CLI TERMINAL --- */}
      {activeSubView === 'terminal' && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-mono flex flex-col h-[600px]">
          {/* Terminal Window Topbar */}
          <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="text-xs text-slate-400 ml-2 font-mono flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" /> firestore://{diag.databaseId}/cases
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => handleRunCommand('clear')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-[11px]"
              >
                Clear Log
              </button>
            </div>
          </div>

          {/* Quick Command Chips */}
          <div className="bg-slate-900/40 px-4 py-2 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mr-1">Quick:</span>
            {[
              { label: 'ls (list cases)', cmd: 'ls' },
              { label: 'status', cmd: 'status' },
              { label: 'inspect images', cmd: 'images' },
              { label: 'sort-order', cmd: 'sort-order' },
              { label: 'get cxr-001', cmd: 'get case-cxr-001' },
              { label: 'stats', cmd: 'stats' },
              { label: 'ping server', cmd: 'ping' },
              { label: 'reseed canonical', cmd: 'reseed' },
              { label: 'clear-cache', cmd: 'clear-cache' },
            ].map((chip) => (
              <button
                key={chip.cmd}
                onClick={() => handleRunCommand(chip.cmd)}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-indigo-600/80 text-slate-300 hover:text-white transition-colors whitespace-nowrap border border-slate-700/50"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Terminal Output Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs select-text">
            {outputLogs.map((log, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-emerald-400 font-bold">radmed@firestore:~$</span>
                  <span className="text-indigo-300 font-semibold">{log.command}</span>
                  <span className="text-[10px] text-slate-600 ml-auto">{log.timestamp}</span>
                </div>

                <div
                  className={`p-3 rounded-xl border text-[11.5px] leading-relaxed whitespace-pre-wrap ${
                    log.isError
                      ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                      : log.format === 'json'
                      ? 'bg-slate-900 border-slate-800 text-emerald-300 overflow-x-auto font-mono'
                      : log.format === 'stats'
                      ? 'bg-indigo-950/30 border-indigo-800/60 text-indigo-200'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-200'
                  }`}
                >
                  {log.output}
                </div>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Terminal Input Bar */}
          <div className="bg-slate-900 border-t border-slate-800 p-3 flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-sm select-none">radmed@firestore:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={inputCommand}
              onChange={(e) => setInputCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type command (e.g. 'ls', 'images', 'get case-cxr-001', 'help')..."
              disabled={isExecuting}
              className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-hidden text-xs font-mono"
              autoFocus
            />
            <button
              onClick={() => handleRunCommand()}
              disabled={isExecuting || !inputCommand.trim()}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 fill-current" /> Run
            </button>
          </div>
        </div>
      )}

      {/* --- SUBVIEW 2: DOCUMENT INSPECTOR --- */}
      {activeSubView === 'inspector' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Document List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <Database className="w-4 h-4 text-indigo-600" /> Firestore Documents ({cases.length})
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-semibold">
                collection: /cases
              </span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {cases.map((c, idx) => {
                const isSelected = c.id === selectedCaseId;
                const isDataUri = isDataOrBlobUrl(c.imageUrl);
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-xs'
                        : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
                          {c.id}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                          isDataUri ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        }`}>
                          {isDataUri ? 'BASE64' : 'CDN'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {c.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column (2 cols): Selected Document Raw JSON & Image Preview */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCase && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold">
                        /cases/{selectedCase.id}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Order Index: {selectedCase.orderIndex || 'Auto'}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                      {selectedCase.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedCase, null, 2), 'doc-json')}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      {copiedKey === 'doc-json' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'doc-json' ? 'Copied' : 'Copy JSON'}
                    </button>
                  </div>
                </div>

                {/* Image Inspection Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-indigo-500" /> Image Storage Attributes
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Storage Format</span>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {isDataOrBlobUrl(selectedCase.imageUrl) ? 'Base64 WebP/JPEG Data URI' : 'Direct HTTPS CDN URL'}
                      </p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Payload Size</span>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {(new Blob([selectedCase.imageUrl]).size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Gallery Scans</span>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {Array.isArray(selectedCase.galleryImages) ? `${selectedCase.galleryImages.length} attached` : 'Single image'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <img
                      src={selectedCase.imageUrl}
                      alt={selectedCase.imageAlt}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-black"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Image URL String:</span>
                      <p className="font-mono text-slate-700 dark:text-slate-300 truncate mt-0.5">
                        {selectedCase.imageUrl}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Raw Document JSON */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-indigo-500" /> Raw Firestore Document Payload
                  </span>
                  <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-[11px] leading-relaxed max-h-[300px] overflow-auto select-text">
                    {JSON.stringify(selectedCase, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- SUBVIEW 3: STORAGE BLUEPRINT & EXPLANATION --- */}
      {activeSubView === 'architecture' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 space-y-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <HardDrive className="w-6 h-6 text-indigo-600" /> How Medical Images & Cases Are Stored in Database
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              RadMed utilizes a high-performance hybrid architecture engineered specifically for medical imaging and instant rendering without image degradation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                Curated High-Res CDN Scans
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Baseline radiographs and CT slices are referenced as authenticated HTTPS CDN URLs (Unsplash CDN, Radiopaedia, PMC). Only the URL strings are saved in Firestore, keeping documents ultra-lightweight (&lt; 2KB).
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                Admin Uploads & Compression
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                When admins or AI agents upload new scans, the client-side downscaling engine in <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">imageUtils.ts</code> optimizes the image to under 200KB WebP/JPEG and embeds it directly in the document, well below Firestore’s 1MB ceiling.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                Deterministic Order Guarantee
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cases are assigned a canonical <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">orderIndex</code> (1..20 for curated baseline) and sorted through <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">sortCasesDeterministically()</code>, preventing flapping on page reloads.
              </p>
            </div>
          </div>

          {/* Database Schema Summary */}
          <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-800/40 space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-600" /> Firestore Document Schema: /cases/[caseId]
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-slate-900 rounded-xl text-slate-300 space-y-1">
                <span className="text-slate-500 font-bold">// Core Identifiers & Sequence</span>
                <p><span className="text-purple-400">id:</span> <span className="text-emerald-300">"case-cxr-001"</span></p>
                <p><span className="text-purple-400">orderIndex:</span> <span className="text-amber-300">1</span></p>
                <p><span className="text-purple-400">modality:</span> <span className="text-emerald-300">"chest_xray" | "head_ct"</span></p>
                <p><span className="text-purple-400">category:</span> <span className="text-emerald-300">"Common Pathology"</span></p>
                <p><span className="text-purple-400">difficulty:</span> <span className="text-emerald-300">"Beginner"</span></p>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl text-slate-300 space-y-1">
                <span className="text-slate-500 font-bold">// Imaging Layer</span>
                <p><span className="text-purple-400">imageUrl:</span> <span className="text-emerald-300">"https://..." | "data:image/..."</span></p>
                <p><span className="text-purple-400">imageAlt:</span> <span className="text-emerald-300">"Description of findings"</span></p>
                <p><span className="text-purple-400">galleryImages:</span> <span className="text-amber-300">[&#123; url, caption &#125;]</span></p>
                <p><span className="text-purple-400">diagnosis:</span> <span className="text-emerald-300">"Clinical diagnosis string"</span></p>
                <p><span className="text-purple-400">keyFindings:</span> <span className="text-amber-300">string[]</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
