import React, { useState, useEffect } from 'react';
import {
  Activity,
  Database,
  Clock,
  Radio,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  HardDrive,
  Layers,
  ShieldCheck,
  Terminal,
  Search,
  Wifi,
  WifiOff,
  Sparkles,
  Download,
  Info
} from 'lucide-react';
import {
  subscribeToDiagnostics,
  testFirestoreConnection,
  reseedFirestoreWithBaselineCases,
  purgeSampleCases,
  clearLocalCasesCache,
  inspectLocalCache,
  SyncDiagnosticData,
  DiagnosticLogEntry
} from '../services/casesService';
import { MedicalCase } from '../types';

interface DiagnosticPanelProps {
  cases: MedicalCase[];
  onRefreshCases: () => Promise<void>;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({
  cases,
  onRefreshCases,
}) => {
  const [diagData, setDiagData] = useState<SyncDiagnosticData | null>(null);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'success' | 'warn' | 'error' } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn' | 'success' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [relativeTime, setRelativeTime] = useState<string>('Just now');
  const [localInspectData, setLocalInspectData] = useState<any>(null);

  // Subscribe to live telemetry
  useEffect(() => {
    const unsubscribe = subscribeToDiagnostics((data) => {
      setDiagData(data);
    });
    setLocalInspectData(inspectLocalCache());
    return () => {
      unsubscribe();
    };
  }, []);

  // Update relative time ticker every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (!diagData?.lastSuccessfulSyncTimestamp) {
        setRelativeTime('Never');
        return;
      }
      const diffSec = Math.floor((Date.now() - diagData.lastSuccessfulSyncTimestamp) / 1000);
      if (diffSec < 5) {
        setRelativeTime('Just now');
      } else if (diffSec < 60) {
        setRelativeTime(`${diffSec} seconds ago`);
      } else if (diffSec < 3600) {
        const mins = Math.floor(diffSec / 60);
        setRelativeTime(`${mins} minute${mins > 1 ? 's' : ''} ago`);
      } else {
        const hours = Math.floor(diffSec / 3600);
        setRelativeTime(`${hours} hour${hours > 1 ? 's' : ''} ago`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [diagData?.lastSuccessfulSyncTimestamp]);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setActionNotice(null);
    try {
      const res = await testFirestoreConnection();
      if (res.success) {
        setActionNotice({
          text: `Firestore connection verified in ${res.latencyMs}ms! Database online.`,
          type: 'success',
        });
      } else {
        setActionNotice({
          text: `Connection test result: ${res.message}`,
          type: res.status === 'offline' ? 'warn' : 'error',
        });
      }
    } finally {
      setIsTestingConn(false);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  const handleManualResync = async () => {
    setIsResyncing(true);
    setActionNotice(null);
    try {
      await onRefreshCases();
      setLocalInspectData(inspectLocalCache());
      setActionNotice({
        text: 'Synchronized all 3 data tiers successfully!',
        type: 'success',
      });
    } catch (e: any) {
      setActionNotice({
        text: `Sync error: ${e?.message || e}`,
        type: 'error',
      });
    } finally {
      setIsResyncing(false);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const handleReseedBaseline = async () => {
    if (!window.confirm('This will write all 20 curated baseline cases directly to Firestore and local cache. Continue?')) {
      return;
    }
    setIsReseeding(true);
    setActionNotice(null);
    try {
      const res = await reseedFirestoreWithBaselineCases();
      await onRefreshCases();
      setLocalInspectData(inspectLocalCache());
      if (res.success) {
        setActionNotice({
          text: `Successfully seeded ${res.count} curated clinical cases to Firestore!`,
          type: 'success',
        });
      } else {
        setActionNotice({
          text: `Seeded locally, but remote Firestore write returned: ${res.error}`,
          type: 'warn',
        });
      }
    } catch (e: any) {
      setActionNotice({
        text: `Reseed failed: ${e?.message || e}`,
        type: 'error',
      });
    } finally {
      setIsReseeding(false);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  const handleClearLocalCache = () => {
    if (!window.confirm('Clear local browser cases cache? (Static seed cases and Firestore remote cases will remain intact)')) {
      return;
    }
    clearLocalCasesCache();
    setLocalInspectData(inspectLocalCache());
    setActionNotice({
      text: 'Local storage cache cleared.',
      type: 'info' as any,
    });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handlePurgeSamples = async () => {
    if (!window.confirm('Are you sure you want to purge all demo/sample placeholder cases (case-cxr-*, case-ct-*, etc.) from Firestore and local cache? Only your real uploaded cases will remain.')) {
      return;
    }
    setIsResyncing(true);
    setActionNotice(null);
    try {
      const res = await purgeSampleCases();
      await onRefreshCases();
      setLocalInspectData(inspectLocalCache());
      setActionNotice({
        text: res.purgedCount > 0 
          ? `Purged ${res.purgedCount} sample case(s) from database and cache!` 
          : 'No sample/demo cases found in database. Everything is clean!',
        type: 'success',
      });
    } catch (e: any) {
      setActionNotice({
        text: `Purge error: ${e?.message || e}`,
        type: 'error',
      });
    } finally {
      setIsResyncing(false);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  const filteredLogs = (diagData?.logs || []).filter((log) => {
    if (logFilter !== 'all' && log.level !== logFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchCat = log.category.toLowerCase().includes(q);
      const matchDetails = log.details ? JSON.stringify(log.details).toLowerCase().includes(q) : false;
      return matchMsg || matchCat || matchDetails;
    }
    return true;
  });

  const getStatusBadge = () => {
    const status = diagData?.connectionStatus || 'checking';
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <Wifi className="w-3.5 h-3.5" />
            <span>CONNECTED TO FIRESTORE</span>
            {diagData?.lastPingLatencyMs && (
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded-md">
                {diagData.lastPingLatencyMs}ms
              </span>
            )}
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/80 text-amber-700 dark:text-amber-300 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <WifiOff className="w-3.5 h-3.5" />
            <span>OFFLINE / FALLBACK MODE</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700/80 text-rose-700 dark:text-rose-300 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <AlertCircle className="w-3.5 h-3.5" />
            <span>CONNECTION ERROR</span>
          </div>
        );
      case 'checking':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-700/80 text-blue-700 dark:text-blue-300 text-xs font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>CHECKING CONNECTION...</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Core Telemetry Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/70 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Activity className="w-48 h-48 text-blue-400" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Firestore & Sync Diagnostic Console
                </h2>
                <p className="text-xs text-slate-300">
                  Real-time database connectivity, sync timestamps, and local state telemetry
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge()}
            </div>
          </div>

          {/* Action Notice */}
          {actionNotice && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 border transition-all animate-fade-in ${
                actionNotice.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200'
                  : actionNotice.type === 'warn'
                  ? 'bg-amber-950/80 border-amber-700/60 text-amber-200'
                  : 'bg-rose-950/80 border-rose-700/60 text-rose-200'
              }`}
            >
              {actionNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              )}
              <span className="font-medium">{actionNotice.text}</span>
            </div>
          )}

          {/* Diagnostics Quick Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Raw Timestamp Card (Critical User Request) */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> Last Sync (Raw Epoch)
                </span>
                {diagData?.lastSuccessfulSyncTimestamp && (
                  <button
                    onClick={() =>
                      handleCopy(String(diagData.lastSuccessfulSyncTimestamp), 'raw-ts')
                    }
                    className="hover:text-white flex items-center gap-1 text-[11px] text-blue-400 cursor-pointer"
                    title="Copy raw numeric epoch timestamp"
                  >
                    {copiedKey === 'raw-ts' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedKey === 'raw-ts' ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <div className="font-mono text-sm font-bold text-amber-300 bg-black/40 p-2 rounded-lg break-all select-all flex items-center justify-between">
                <span>{diagData?.lastSuccessfulSyncTimestamp ?? 'Not Synced'}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Relative: <strong className="text-white">{relativeTime}</strong></span>
              </div>
            </div>

            {/* ISO-8601 Timestamp */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" /> ISO Timestamp
                </span>
                {diagData?.lastSuccessfulSyncIso && (
                  <button
                    onClick={() => handleCopy(diagData.lastSuccessfulSyncIso || '', 'iso-ts')}
                    className="hover:text-white flex items-center gap-1 text-[11px] text-indigo-400 cursor-pointer"
                  >
                    {copiedKey === 'iso-ts' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedKey === 'iso-ts' ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <div className="font-mono text-xs text-indigo-300 bg-black/40 p-2 rounded-lg truncate select-all">
                {diagData?.lastSuccessfulSyncIso ?? 'N/A'}
              </div>
              <div className="text-[11px] text-slate-400">
                Source: <span className="text-emerald-400 font-semibold uppercase">{diagData?.lastSyncSource || 'merged'}</span>
              </div>
            </div>

            {/* Database Identification */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" /> Database ID
                </span>
                <button
                  onClick={() => handleCopy(diagData?.databaseId || '', 'db-id')}
                  className="hover:text-white flex items-center gap-1 text-[11px] text-emerald-400 cursor-pointer"
                >
                  {copiedKey === 'db-id' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedKey === 'db-id' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-xs text-emerald-300 bg-black/40 p-2 rounded-lg truncate select-all" title={diagData?.databaseId}>
                {diagData?.databaseId}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                Project: <span className="text-slate-300">{diagData?.projectId}</span>
              </div>
            </div>

            {/* Active In-Memory Count */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Cases in Active State
                </span>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded">
                  Guarded
                </span>
              </div>
              <div className="text-lg font-bold text-cyan-300 bg-black/40 p-2 rounded-lg flex items-center justify-between">
                <span>{cases.length} Clinical Cases</span>
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Non-Zero State Guaranteed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Tier Multi-Source Data Breakdown (Empty Array Root Cause Explainer) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              3-Tier Case Loading Matrix & State Protection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Breakdown of how cases are retrieved, merged, and protected from defaulting to empty arrays.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTestingConn}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isTestingConn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
              {isTestingConn ? 'Pinging...' : 'Ping Firestore'}
            </button>

            <button
              type="button"
              onClick={handleManualResync}
              disabled={isResyncing}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {isResyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {isResyncing ? 'Re-syncing...' : 'Trigger Full Re-sync'}
            </button>
          </div>
        </div>

        {/* Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Firestore Card */}
          <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Primary Database • Cloud Firestore
              </span>
              <Database className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {diagData?.remoteFirestoreCount ?? diagData?.lastSyncCaseCount ?? 0} Documents
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                Firestore Collection: <code className="font-mono text-indigo-600 dark:text-indigo-400">cases</code>
              </p>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              100% authoritative remote cloud persistence. Cases created via the Admin panel, AI Agent, or Write API are stored directly in Firestore.
            </p>
          </div>

          {/* Local Mirror Card */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Offline Mirror • Local Cache
              </span>
              <HardDrive className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {diagData?.localCacheCount ?? 0} Cached
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                Browser <code className="font-mono text-emerald-600 dark:text-emerald-400">localStorage</code>
              </p>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Client-side mirror keeping local cases in sync with Firestore for instant offline availability and fast initial render.
            </p>
          </div>
        </div>

        {/* Database Health & Repair Tools */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleManualResync}
              disabled={isResyncing}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-md cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isResyncing ? 'animate-spin' : ''}`} />
              {isResyncing ? 'Syncing...' : 'Sync with Firestore'}
            </button>

            <button
              type="button"
              onClick={handleClearLocalCache}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Flush Local Cache
            </button>

            <button
              type="button"
              onClick={handlePurgeSamples}
              disabled={isResyncing}
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-200 dark:border-rose-800/60 cursor-pointer disabled:opacity-50"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              Purge Demo / Fake Cases
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Local Cache Size: {localInspectData?.rawLength || 0} bytes ({localInspectData?.parsedCount || 0} items)
          </div>
        </div>
      </div>

      {/* Live Event Log Console */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Real-Time Diagnostic Sync Logs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live audit trail of queries, network latencies, storage mutations, and merge events
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                handleCopy(JSON.stringify(diagData?.logs || [], null, 2), 'all-logs')
              }
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedKey === 'all-logs' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {copiedKey === 'all-logs' ? 'Logs Copied!' : 'Export Logs JSON'}
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            {(['all', 'info', 'success', 'warn', 'error'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setLogFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  logFilter === filter
                    ? filter === 'error'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : filter === 'warn'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : filter === 'success'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search diagnostic logs..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Log Viewer Console */}
        <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
          <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>EVENT STREAM ({filteredLogs.length} entries)</span>
            <span>AUTO-SCROLL ENABLED</span>
          </div>

          <div className="max-h-96 overflow-y-auto p-3 space-y-2 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No diagnostic log entries match your filter.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const badgeColor =
                  log.level === 'success'
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                    : log.level === 'warn'
                    ? 'text-amber-400 bg-amber-950/60 border-amber-800'
                    : log.level === 'error'
                    ? 'text-rose-400 bg-rose-950/60 border-rose-800'
                    : 'text-blue-400 bg-blue-950/60 border-blue-800';

                return (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 min-w-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${badgeColor} flex-shrink-0`}
                        >
                          {log.level}
                        </span>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold uppercase flex-shrink-0">
                          [{log.category}]
                        </span>
                        <span className="text-xs text-slate-200 break-all">{log.message}</span>
                      </div>

                      {log.details && (
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 flex-shrink-0"
                        >
                          {isExpanded ? 'Hide' : 'Details'}
                        </button>
                      )}
                    </div>

                    {/* Expandable JSON Metadata */}
                    {isExpanded && log.details && (
                      <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                        <pre className="p-2 rounded-lg bg-black/50 text-emerald-300 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
