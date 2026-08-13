import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Brain, 
  Layers, 
  Search, 
  ArrowRight, 
  Award, 
  BookOpen, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { ActiveView, Modality, MedicalCase } from '../types';

interface HomeScreenProps {
  setActiveView: (view: ActiveView) => void;
  setSelectedModality: (modality: Modality) => void;
  cases: MedicalCase[];
  onSelectCase: (c: MedicalCase) => void;
  reviewedCases: string[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  setActiveView,
  setSelectedModality,
  cases,
  onSelectCase,
  reviewedCases,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MedicalCase[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const cxrCarouselRef = useRef<HTMLDivElement>(null);
  const ctCarouselRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q.trim().length > 1) {
      setIsSearching(true);
      const filtered = cases.filter(
        c => 
          c.title.toLowerCase().includes(q.toLowerCase()) ||
          c.diagnosis.toLowerCase().includes(q.toLowerCase()) ||
          c.keyFindings.some(f => f.toLowerCase().includes(q.toLowerCase()))
      );
      setSearchResults(filtered);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const totalCases = cases.length;
  const cxrCases = cases.filter(c => c.modality === 'chest_xray');
  const ctCases = cases.filter(c => c.modality === 'head_ct');
  const reviewedCount = reviewedCases.length;
  const progressPercent = Math.round((reviewedCount / totalCases) * 100);

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-slate-900 to-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-6 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            Continuous Medical Education • Interactive Radiology Website
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            RadMed – Master <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              Chest X-rays & Head CTs
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
            Explore curated radiographic and cross-sectional brain CT carousels designed for medical students, interns, residents, and clinicians.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative mb-8">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search cases by diagnosis, finding, or keyword (e.g. Pneumothorax, Subdural)..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/15 transition-all text-sm sm:text-base shadow-2xl"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearching(false);
                  }}
                  className="absolute right-4 text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg text-white transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Instant Search Results Dropdown */}
            {isSearching && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-96 overflow-y-auto z-50 text-left p-2">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Search Results ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    No matching radiology cases found for "{searchQuery}".
                  </div>
                ) : (
                  searchResults.map(c => (
                    <div
                      key={c.id}
                      onClick={() => onSelectCase(c)}
                      className="flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
                        <img src={c.imageUrl} alt={c.imageAlt} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            c.modality === 'chest_xray' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}>
                            {c.modality === 'chest_xray' ? 'Chest X-ray' : 'Head CT'}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">• {c.category}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {c.diagnosis}
                        </h4>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Stats bar */}
          <div className="inline-flex flex-wrap items-center justify-center gap-6 sm:gap-12 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 backdrop-blur-md text-sm">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-400" />
              <span><strong>{totalCases}</strong> Expert Cases</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span><strong>{progressPercent}%</strong> Mastered ({reviewedCount}/{totalCases})</span>
            </div>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-indigo-400" />
              <span>CME Accredited Format</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Website Carousels & Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 space-y-12">
        
        {/* Secondary Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => setActiveView('flashcards')}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 transition-colors">
                Flashcard Practice
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Flip cards & active recall test.
              </p>
            </div>
          </div>

          <div
            onClick={() => setActiveView('disclaimer')}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 transition-colors">
                How to Use & CME Info
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Resident guidelines & report templates.
              </p>
            </div>
          </div>

          <div
            onClick={() => setActiveView('disclaimer')}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 transition-colors">
                Clinical Disclaimer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Educational reference only.
              </p>
            </div>
          </div>
        </div>

        {/* --- SECTION 1: CHEST X-RAY CAROUSEL --- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Chest X-ray Carousel Library
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PA & Lateral radiographs: Normal variants, lobar pneumonia, pneumothorax, and CHF
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedModality('chest_xray');
                  setActiveView('carousel');
                }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mr-2"
              >
                View All ({cxrCases.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => scrollCarousel(cxrCarouselRef, 'left')}
                className="p-2.5 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollCarousel(cxrCarouselRef, 'right')}
                className="p-2.5 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Horizontal Carousel Track */}
          <div 
            ref={cxrCarouselRef}
            className="flex gap-6 overflow-x-auto pb-4 pt-2 px-1 scrollbar-none snap-x snap-mandatory"
            style={{ scrollBehavior: 'smooth' }}
          >
            {cxrCases.map((c) => {
              const isReviewed = reviewedCases.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCase(c)}
                  className="flex-shrink-0 w-80 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer snap-center group flex flex-col justify-between"
                >
                  <div className="relative h-56 bg-slate-950 overflow-hidden">
                    <img 
                      src={c.imageUrl} 
                      alt={c.imageAlt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full text-white backdrop-blur-md ${
                        c.category === 'Emergency Findings' ? 'bg-rose-500/90' : 'bg-blue-600/90'
                      }`}>
                        {c.category}
                      </span>
                    </div>
                    {isReviewed && (
                      <span className="absolute top-3 right-3 bg-emerald-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md">
                        ✓ Reviewed
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md">
                        {c.difficulty}
                      </span>
                      <span className="text-xs bg-blue-600/80 hover:bg-blue-600 px-3 py-1 rounded-lg font-semibold flex items-center gap-1 backdrop-blur-md">
                        <Eye className="w-3.5 h-3.5" /> Inspect Case
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1.5 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {c.diagnosis}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {c.keyFindings[0]}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- SECTION 2: HEAD CT CAROUSEL --- */}
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Head CT Carousel Library
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Non-contrast brain CT: Epidural & subdural hematomas, SAH, MCA infarcts, and skull fractures
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedModality('head_ct');
                  setActiveView('carousel');
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mr-2"
              >
                View All ({ctCases.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => scrollCarousel(ctCarouselRef, 'left')}
                className="p-2.5 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollCarousel(ctCarouselRef, 'right')}
                className="p-2.5 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Horizontal Carousel Track */}
          <div 
            ref={ctCarouselRef}
            className="flex gap-6 overflow-x-auto pb-6 pt-2 px-1 scrollbar-none snap-x snap-mandatory"
            style={{ scrollBehavior: 'smooth' }}
          >
            {ctCases.map((c) => {
              const isReviewed = reviewedCases.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCase(c)}
                  className="flex-shrink-0 w-80 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer snap-center group flex flex-col justify-between"
                >
                  <div className="relative h-56 bg-slate-950 overflow-hidden">
                    <img 
                      src={c.imageUrl} 
                      alt={c.imageAlt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full text-white backdrop-blur-md ${
                        c.category === 'Emergency Findings' ? 'bg-rose-500/90' : 'bg-indigo-600/90'
                      }`}>
                        {c.category}
                      </span>
                    </div>
                    {isReviewed && (
                      <span className="absolute top-3 right-3 bg-emerald-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md">
                        ✓ Reviewed
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md">
                        {c.difficulty}
                      </span>
                      <span className="text-xs bg-indigo-600/80 hover:bg-indigo-600 px-3 py-1 rounded-lg font-semibold flex items-center gap-1 backdrop-blur-md">
                        <Eye className="w-3.5 h-3.5" /> Inspect Case
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1.5 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {c.diagnosis}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {c.keyFindings[0]}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
