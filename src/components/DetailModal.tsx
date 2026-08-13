import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  BookOpen, 
  Stethoscope, 
  AlertCircle, 
  FileText, 
  Lightbulb, 
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { MedicalCase } from '../types';

interface DetailModalProps {
  currentCase: MedicalCase;
  allCases: MedicalCase[];
  onSelectCase: (c: MedicalCase) => void;
  onClose: () => void;
  onMarkReviewed: (id: string) => void;
  isReviewed: boolean;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  currentCase,
  allCases,
  onSelectCase,
  onClose,
  onMarkReviewed,
  isReviewed,
}) => {
  const [activeTab, setActiveTab] = useState<'findings' | 'clinical' | 'reporting' | 'teaching'>('findings');
  const [copied, setCopied] = useState(false);

  // Find index in filtered or all cases of same modality
  const sameModalityCases = allCases.filter(c => c.modality === currentCase.modality);
  const currentIndex = sameModalityCases.findIndex(c => c.id === currentCase.id);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectCase(sameModalityCases[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < sameModalityCases.length - 1) {
      onSelectCase(sameModalityCases[currentIndex + 1]);
    }
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(currentCase.reportingTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              currentCase.modality === 'chest_xray'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
            }`}>
              {currentCase.modality === 'chest_xray' ? 'Chest X-ray' : 'Head CT'}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
              currentCase.category === 'Emergency Findings'
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {currentCase.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onMarkReviewed(currentCase.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                isReviewed
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isReviewed ? 'Mastered / Reviewed' : 'Mark as Reviewed'}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Large Image & Quick Nav */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-slate-200 dark:border-slate-800 group">
                <img 
                  src={currentCase.imageUrl} 
                  alt={currentCase.imageAlt}
                  className="w-full h-80 sm:h-96 object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-xs font-medium opacity-90">{currentCase.imageAlt}</p>
                </div>
              </div>

              {/* Prev / Next Case Navigation */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex <= 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Case
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex >= sameModalityCases.length - 1}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next Case <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* CME Tip Callout Box */}
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 text-xs text-blue-900 dark:text-blue-200">
                <div className="flex items-center gap-2 font-bold mb-1 text-blue-700 dark:text-blue-300">
                  <Lightbulb className="w-4 h-4" /> CME Pearl & Clinical Tip
                </div>
                <p className="leading-relaxed">{currentCase.cmeTip}</p>
              </div>
            </div>

            {/* Right Column: Structured Educational Content */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {currentCase.title}
                </h2>
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                  <span>Diagnosis: {currentCase.diagnosis}</span>
                </div>
              </div>

              {/* Section Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveTab('findings')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'findings'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Key Findings
                </button>
                <button
                  onClick={() => setActiveTab('clinical')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'clinical'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Clinical & Differential
                </button>
                <button
                  onClick={() => setActiveTab('reporting')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'reporting'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  How to Report It
                </button>
                <button
                  onClick={() => setActiveTab('teaching')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'teaching'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Teaching Points
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 space-y-6 text-sm text-slate-700 dark:text-slate-300">
                
                {/* Findings Tab */}
                {activeTab === 'findings' && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" /> Radiologic Key Findings
                    </h3>
                    <ul className="space-y-2.5">
                      {currentCase.keyFindings.map((finding, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Clinical & Differential Tab */}
                {activeTab === 'clinical' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                        <Stethoscope className="w-4 h-4 text-indigo-600" /> Clinical Significance
                      </h3>
                      <p className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                        {currentCase.clinicalSignificance}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" /> Differential Diagnosis
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {currentCase.differentialDiagnosis.map((diff, idx) => (
                          <span key={idx} className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs border border-slate-200 dark:border-slate-700">
                            {diff}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reporting Tab */}
                {activeTab === 'reporting' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" /> Sample Report Language
                      </h3>
                      <button
                        onClick={handleCopyReport}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-semibold text-xs hover:bg-blue-100 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy Template'}
                      </button>
                    </div>
                    <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs leading-relaxed whitespace-pre-wrap border border-slate-800">
                      {currentCase.reportingTemplate}
                    </div>
                  </div>
                )}

                {/* Teaching Points Tab */}
                {activeTab === 'teaching' && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-600" /> Resident Pearls & Teaching Points
                    </h3>
                    <div className="space-y-3">
                      {currentCase.teachingPoints.map((tp, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/40">
                          <span className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {idx + 1}
                          </span>
                          <p className="leading-relaxed">{tp}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="text-xs text-slate-500">
            Difficulty Level: <strong className="text-slate-900 dark:text-white">{currentCase.difficulty}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-md"
          >
            Back to Library
          </button>
        </div>

      </div>
    </div>
  );
};
