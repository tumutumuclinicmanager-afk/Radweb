import React, { useState, useMemo } from 'react';
import { MedicalCase, Modality, UserProfile } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  CheckCircle2,
  Circle,
  TrendingUp,
  Award,
  BookOpen,
  ArrowLeft,
  Filter,
  Search,
  Clock,
  Sparkles,
  Lock,
  ChevronRight,
  RotateCcw,
  Zap,
  Activity,
  Layers,
  FileText,
  AlertCircle
} from 'lucide-react';
import { isCaseLocked } from '../services/paymentService';

interface ProgressDashboardProps {
  cases: MedicalCase[];
  reviewedCases: string[];
  onSelectCase: (c: MedicalCase) => void;
  onMarkReviewed: (id: string) => void;
  onToggleReviewed: (id: string) => void;
  onResetProgress: () => void;
  onBackToHome: () => void;
  onOpenPaymentModal: (category?: string, title?: string) => void;
  isPremium: boolean;
  currentUser?: UserProfile | null;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  cases,
  reviewedCases,
  onSelectCase,
  onMarkReviewed,
  onToggleReviewed,
  onResetProgress,
  onBackToHome,
  onOpenPaymentModal,
  isPremium,
  currentUser,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'reviewed' | 'unreviewed'>('all');
  const [filterModality, setFilterModality] = useState<'all' | Modality>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Overall calculations
  const totalCases = cases.length;
  const reviewedCount = useMemo(
    () => cases.filter((c) => reviewedCases.includes(c.id)).length,
    [cases, reviewedCases]
  );
  const unreviewedCount = Math.max(0, totalCases - reviewedCount);
  const progressPercent = totalCases > 0 ? Math.round((reviewedCount / totalCases) * 100) : 0;
  const estimatedCmeHours = ((reviewedCount * 15) / 60).toFixed(1);

  // Modality statistics
  const cxrCases = useMemo(() => cases.filter((c) => c.modality === 'chest_xray'), [cases]);
  const ctCases = useMemo(() => cases.filter((c) => c.modality === 'head_ct'), [cases]);

  const cxrTotal = cxrCases.length;
  const cxrReviewed = useMemo(
    () => cxrCases.filter((c) => reviewedCases.includes(c.id)).length,
    [cxrCases, reviewedCases]
  );
  const cxrRemaining = Math.max(0, cxrTotal - cxrReviewed);
  const cxrPercent = cxrTotal > 0 ? Math.round((cxrReviewed / cxrTotal) * 100) : 0;

  const ctTotal = ctCases.length;
  const ctReviewed = useMemo(
    () => ctCases.filter((c) => reviewedCases.includes(c.id)).length,
    [ctCases, reviewedCases]
  );
  const ctRemaining = Math.max(0, ctTotal - ctReviewed);
  const ctPercent = ctTotal > 0 ? Math.round((ctReviewed / ctTotal) * 100) : 0;

  // Chart data for activity by modality
  const modalityBarData = useMemo(() => [
    {
      modality: 'Chest X-Ray (CXR)',
      shortName: 'CXR',
      Reviewed: cxrReviewed,
      Remaining: cxrRemaining,
      Total: cxrTotal,
      Percent: cxrPercent,
    },
    {
      modality: 'Head CT',
      shortName: 'Head CT',
      Reviewed: ctReviewed,
      Remaining: ctRemaining,
      Total: ctTotal,
      Percent: ctPercent,
    },
  ], [cxrReviewed, cxrRemaining, cxrTotal, cxrPercent, ctReviewed, ctRemaining, ctTotal, ctPercent]);

  // Pie chart data for reviewed activity distribution
  const modalityPieData = useMemo(() => [
    { name: 'Chest X-Ray', value: cxrReviewed, color: '#2563eb' },
    { name: 'Head CT', value: ctReviewed, color: '#0d9488' },
  ].filter((item) => item.value > 0), [cxrReviewed, ctReviewed]);

  // Difficulty statistics
  const difficultyStats = useMemo(() => {
    const levels: ('Beginner' | 'Intermediate' | 'Advanced')[] = ['Beginner', 'Intermediate', 'Advanced'];
    return levels.map((lvl) => {
      const levelCases = cases.filter((c) => c.difficulty === lvl);
      const levelReviewed = levelCases.filter((c) => reviewedCases.includes(c.id)).length;
      const pct = levelCases.length > 0 ? Math.round((levelReviewed / levelCases.length) * 100) : 0;
      return {
        level: lvl,
        total: levelCases.length,
        reviewed: levelReviewed,
        percent: pct,
      };
    });
  }, [cases, reviewedCases]);

  // Category statistics
  const categoryStats = useMemo(() => {
    const categories = ['Emergency Findings', 'Common Pathology', 'Normal', 'Post-Procedural'];
    return categories.map((cat) => {
      const catCases = cases.filter((c) => c.category === cat);
      const catReviewed = catCases.filter((c) => reviewedCases.includes(c.id)).length;
      const pct = catCases.length > 0 ? Math.round((catReviewed / catCases.length) * 100) : 0;
      return {
        category: cat,
        total: catCases.length,
        reviewed: catReviewed,
        percent: pct,
      };
    });
  }, [cases, reviewedCases]);

  // Filtered cases list
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const isRev = reviewedCases.includes(c.id);
      if (filterStatus === 'reviewed' && !isRev) return false;
      if (filterStatus === 'unreviewed' && isRev) return false;

      if (filterModality !== 'all' && c.modality !== filterModality) return false;
      if (filterDifficulty !== 'all' && c.difficulty !== filterDifficulty) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(query);
        const matchDiag = c.diagnosis.toLowerCase().includes(query);
        const matchCategory = c.category.toLowerCase().includes(query);
        if (!matchTitle && !matchDiag && !matchCategory) return false;
      }

      return true;
    });
  }, [cases, reviewedCases, filterStatus, filterModality, filterDifficulty, searchQuery]);

  // Find next unstudied case
  const nextUnstudiedCase = useMemo(() => {
    return cases.find((c) => !reviewedCases.includes(c.id));
  }, [cases, reviewedCases]);

  const handleCaseCardClick = (c: MedicalCase) => {
    const locked = isCaseLocked(c, cases, isPremium);
    if (locked) {
      onOpenPaymentModal(c.category, c.title);
    } else {
      onSelectCase(c);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={onBackToHome}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Personal CME Dashboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>My Progress</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {progressPercent}% Complete
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics for continuous medical education case reviews across modalities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {nextUnstudiedCase && (
            <button
              onClick={() => handleCaseCardClick(nextUnstudiedCase)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Study Next Case</span>
            </button>
          )}

          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset studied case progress"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Primary Mastery Metric & Progress Bar Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Overall CME Case Mastery
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {reviewedCount}
              </span>
              <span className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                / {totalCases} Cases Reviewed
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-right">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Estimated CME Credits
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {estimatedCmeHours} Hours
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-right">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Mastery Rate
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {progressPercent}%
              </div>
            </div>
          </div>
        </div>

        {/* The Master Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Overall Completion</span>
            <span className="font-bold text-slate-900 dark:text-white">{progressPercent}%</span>
          </div>
          <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>0 Cases</span>
            <span>{unreviewedCount} cases remaining to complete curriculum</span>
            <span>{totalCases} Cases</span>
          </div>
        </div>

        {/* 4 Summary Stat Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Reviewed
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{reviewedCount}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              {progressPercent}% of curriculum
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <Circle className="w-4 h-4 text-amber-500" />
              Remaining
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{unreviewedCount}</div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              {100 - progressPercent}% unreviewed
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <BookOpen className="w-4 h-4 text-blue-500" />
              CXR Reviewed
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {cxrReviewed} <span className="text-xs font-normal text-slate-400">/ {cxrTotal}</span>
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
              {cxrPercent}% mastered
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <Layers className="w-4 h-4 text-teal-500" />
              Head CT Reviewed
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {ctReviewed} <span className="text-xs font-normal text-slate-400">/ {ctTotal}</span>
            </div>
            <div className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
              {ctPercent}% mastered
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics: Activity by Modality Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Modality Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Case Activity by Modality
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparison of reviewed versus remaining cases across Chest Radiographs and Head CTs
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-sm bg-blue-600"></span> Reviewed
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-700"></span> Remaining
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={modalityBarData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="modality"
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 text-white p-3 rounded-xl shadow-2xl border border-slate-800 text-xs space-y-1.5">
                          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">
                            {data.modality}
                          </div>
                          <div className="flex items-center justify-between gap-4 text-emerald-400">
                            <span>Reviewed:</span>
                            <span className="font-bold font-mono">{data.Reviewed}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-slate-400">
                            <span>Remaining:</span>
                            <span className="font-bold font-mono">{data.Remaining}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-blue-400 pt-1 border-t border-slate-800">
                            <span>Total Available:</span>
                            <span className="font-bold font-mono">{data.Total}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 pt-0.5">
                            Mastery: <span className="font-bold text-white">{data.Percent}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="Reviewed" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={56} />
                <Bar dataKey="Remaining" fill="#94a3b8" radius={[6, 6, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Individual Modality Quick Progress Strips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                <span>Chest Radiographs (CXR)</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{cxrPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${cxrPercent}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {cxrReviewed} of {cxrTotal} cases mastered ({cxrRemaining} left)
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                <span>Non-Contrast Head CT</span>
                <span className="text-teal-600 dark:text-teal-400 font-bold">{ctPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-500"
                  style={{ width: `${ctPercent}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {ctReviewed} of {ctTotal} cases mastered ({ctRemaining} left)
              </div>
            </div>
          </div>
        </div>

        {/* Modality Share & Mastery Breakdown (1 col) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Award className="w-5 h-5 text-amber-500" />
              Reviewed Modality Share
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribution of your completed CME reviews
            </p>

            {reviewedCount > 0 ? (
              <div className="h-48 w-full relative mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modalityPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {modalityPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          const pct = Math.round(((data.value as number) / reviewedCount) * 100);
                          return (
                            <div className="bg-slate-950 text-white p-2.5 rounded-xl shadow-xl border border-slate-800 text-xs">
                              <span className="font-bold">{data.name}:</span> {data.value} cases ({pct}%)
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {reviewedCount}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Reviewed</span>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl my-2">
                <BookOpen className="w-8 h-8 text-slate-400 mb-2 opacity-60" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  No cases reviewed yet
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Complete your first case to see modality distribution
                </span>
              </div>
            )}
          </div>

          {/* Breakdown by Difficulty */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Difficulty Mastery
            </span>
            {difficultyStats.map((st) => (
              <div key={st.level} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{st.level}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {st.reviewed}/{st.total} ({st.percent}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      st.level === 'Beginner'
                        ? 'bg-emerald-500'
                        : st.level === 'Intermediate'
                        ? 'bg-blue-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${st.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Breakdown Badges */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Mastery by Clinical Pathology Category
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {categoryStats.map((cat) => (
            <div
              key={cat.category}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {cat.category}
                </span>
                <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                  {cat.percent}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                  style={{ width: `${cat.percent}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {cat.reviewed} of {cat.total} reviewed
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Case Explorer Checklist */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Curriculum Review Checklist
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Check off cases as you master them or click any case to review diagnosis and teaching pearls.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({totalCases})
              </button>
              <button
                onClick={() => setFilterStatus('reviewed')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'reviewed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Reviewed ({reviewedCount})
              </button>
              <button
                onClick={() => setFilterStatus('unreviewed')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'unreviewed'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Pending ({unreviewedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Modality & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case name, diagnosis, or pathology..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterModality}
            onChange={(e) => setFilterModality(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
          >
            <option value="all">All Modalities</option>
            <option value="chest_xray">Chest X-Ray (CXR)</option>
            <option value="head_ct">Head CT</option>
          </select>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
          >
            <option value="all">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {/* List of Cases */}
        <div className="space-y-2.5">
          {filteredCases.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-semibold">No cases match the selected filters</p>
              <p className="text-xs text-slate-400 mt-1">Try changing the status tab or search query</p>
            </div>
          ) : (
            filteredCases.map((c, idx) => {
              const isRev = reviewedCases.includes(c.id);
              const locked = isCaseLocked(c, cases, isPremium);

              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isRev
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-200/70 dark:border-emerald-900/40 hover:border-emerald-300'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Toggle Review Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleReviewed(c.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isRev
                          ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={isRev ? 'Mark as unreviewed' : 'Mark as reviewed'}
                    >
                      {isRev ? (
                        <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div
                      onClick={() => handleCaseCardClick(c)}
                      className="cursor-pointer min-w-0 flex-1"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-semibold text-slate-400">
                          #{idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            c.modality === 'head_ct'
                              ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {c.modality === 'head_ct' ? 'Head CT' : 'CXR'}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {c.category}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {c.difficulty}
                        </span>
                        {locked && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            <Lock className="w-2.5 h-2.5" /> M-Pesa Locked
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {c.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        Diagnosis: <strong className="font-semibold text-slate-700 dark:text-slate-300">{c.diagnosis}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Right Action */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleCaseCardClick(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        locked
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : isRev
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300'
                          : 'bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {locked ? (
                        <>
                          <Lock className="w-3.5 h-3.5" /> Unlock
                        </>
                      ) : isRev ? (
                        <>
                          <span>Review Again</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Study Case</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reset All CME Progress?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                This will reset your marked reviews across all {totalCases} cases so you can repeat the curriculum from the beginning.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onResetProgress();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
