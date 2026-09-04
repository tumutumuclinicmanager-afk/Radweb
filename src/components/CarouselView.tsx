import React, { useState, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  FileText, 
  Brain, 
  Eye, 
  CheckCircle, 
  Sparkles,
  Maximize2,
  Lock,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { MedicalCase, Modality, Category } from '../types';
import { isCaseLocked, getCaseCategoryIndex, FREE_CXR_LIMIT, FREE_CT_LIMIT } from '../services/paymentService';
import { sortCasesDeterministically } from '../services/casesService';
import { getSafeImageUrl, handleImageError } from '../lib/imageUtils';
import { FormattedText } from './FormattedText';

interface CarouselViewProps {
  cases: MedicalCase[];
  selectedModality: Modality;
  setSelectedModality: (modality: Modality) => void;
  onSelectCase: (c: MedicalCase) => void;
  reviewedCases: string[];
  isPremium: boolean;
  onOpenPaymentModal: (category?: string, caseTitle?: string) => void;
}

export const CarouselView: React.FC<CarouselViewProps> = ({
  cases,
  selectedModality,
  setSelectedModality,
  onSelectCase,
  reviewedCases,
  isPremium,
  onOpenPaymentModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Filter cases based on modality, category, and search, with Normal cases prioritized first
  const filteredCases = sortCasesDeterministically(
    cases.filter(c => {
      const matchesModality = c.modality === selectedModality;
      const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
      const matchesSearch = 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.keyFindings.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesModality && matchesCategory && matchesSearch;
    })
  );

  const categories: Category[] = ['All', 'Normal', 'Common Pathology', 'Emergency Findings'];

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = 320; // approximate card width + gap
      carouselRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
      setCurrentIndex(index);
    }
  };

  const handlePrev = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    scrollToIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(filteredCases.length - 1, currentIndex + 1);
    scrollToIndex(newIndex);
  };

  // Count locked cases in current view
  const lockedCountInView = filteredCases.filter(c => isCaseLocked(c, cases, isPremium)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Modality Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              Interactive Case Gallery
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {filteredCases.length} Cases Available
            </span>
            {isPremium ? (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> RadMed Pro Active
              </span>
            ) : (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                {selectedModality === 'chest_xray' ? `${FREE_CXR_LIMIT} Free CXR Cases` : `${FREE_CT_LIMIT} Free Head CT Cases`}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {selectedModality === 'chest_xray' ? 'Chest X-ray Library' : 'Head CT Library'}
          </h1>
        </div>

        {/* Modality Tabs */}
        <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => {
              setSelectedModality('chest_xray');
              setCurrentIndex(0);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              selectedModality === 'chest_xray'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Chest X-ray
          </button>
          <button
            onClick={() => {
              setSelectedModality('head_ct');
              setCurrentIndex(0);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              selectedModality === 'head_ct'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Brain className="w-4 h-4" />
            Head CT
          </button>
        </div>
      </div>

      {/* Free Tier Notice Banner (if non-premium) */}
      {!isPremium && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-900/40 via-slate-900/60 to-slate-900/40 border border-emerald-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-200">
                Lipa Na M-Pesa • Lifetime Access to All {cases.length} Radiology Cases
              </h4>
              <p className="text-xs text-slate-300">
                Free tier includes {FREE_CXR_LIMIT} Chest X-rays & {FREE_CT_LIMIT} Head CT scans. Pay KES 1,000 via Safaricom M-Pesa once for permanent lifetime access.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenPaymentModal(selectedCategory, undefined)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 whitespace-nowrap transition-all"
          >
            <Sparkles className="w-4 h-4" /> Unlock All with M-Pesa
          </button>
        </div>
      )}

      {/* Filters & Search Bar Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0 ml-1 mr-1" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentIndex(0);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in this library..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Carousel Container */}
      {filteredCases.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No cases found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Try adjusting your search query or category filter.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Navigation Arrows */}
          <div className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 z-10">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Previous case"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
          <div className="absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 z-10">
            <button
              onClick={handleNext}
              disabled={currentIndex >= filteredCases.length - 1}
              className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Next case"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Cards Track */}
          <div 
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto pb-6 pt-2 px-2 scrollbar-none snap-x snap-mandatory"
            style={{ scrollBehavior: 'smooth' }}
          >
            {filteredCases.map((c, idx) => {
              const isReviewed = reviewedCases.includes(c.id);
              const locked = isCaseLocked(c, cases, isPremium);
              const { indexInCategory } = getCaseCategoryIndex(c, cases);

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    if (locked) {
                      onOpenPaymentModal(c.category, c.title);
                    } else {
                      onSelectCase(c);
                    }
                  }}
                  className={`flex-shrink-0 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-lg border transition-all duration-300 cursor-pointer snap-center group flex flex-col justify-between ${
                    locked
                      ? 'border-amber-400/40 dark:border-amber-500/30 hover:border-emerald-500 shadow-amber-500/5'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50'
                  }`}
                >
                  {/* Image Header with Badge */}
                  <div className="relative h-64 bg-slate-900 overflow-hidden">
                    <img 
                      src={getSafeImageUrl(c.imageUrl, 800, 80)} 
                      alt={c.imageAlt || c.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e)}
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        locked ? 'blur-2xl opacity-10 scale-110 pointer-events-none select-none' : 'opacity-90 group-hover:opacity-100 group-hover:scale-105'
                      }`} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-md ${
                        c.category === 'Emergency Findings' 
                          ? 'bg-rose-500/90 text-white' 
                          : c.category === 'Normal'
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-blue-600/90 text-white'
                      }`}>
                        {c.category}
                      </span>

                      {locked ? (
                        <span className="flex items-center gap-1 bg-amber-500 text-slate-950 text-xs font-extrabold px-2.5 py-1 rounded-full backdrop-blur-md shadow-md">
                          <Lock className="w-3.5 h-3.5" /> Premium
                        </span>
                      ) : isReviewed ? (
                        <span className="flex items-center gap-1 bg-emerald-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-md shadow-md">
                          <CheckCircle className="w-3.5 h-3.5" /> Reviewed
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold bg-blue-600/80 text-white px-2 py-0.5 rounded-full backdrop-blur-md">
                          Free Case #{indexInCategory}
                        </span>
                      )}
                    </div>

                    {/* Locked Center Overlay */}
                    {locked && (
                      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl flex flex-col items-center justify-center p-4 text-center z-10 select-none">
                        <div className="w-13 h-13 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center mb-2 shadow-xl">
                          <Lock className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-white tracking-wide uppercase">
                          {c.modality === 'chest_xray' ? 'Chest X-Ray' : 'Head CT'} Locked
                        </span>
                        <span className="text-xs text-amber-300 font-bold bg-amber-950/90 border border-amber-500/40 px-3 py-1 rounded-full shadow-md mt-1.5">
                          Unlock with Pro (KES 1,000)
                        </span>
                      </div>
                    )}

                    {/* Bottom overlay badge */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md">
                        Case {idx + 1} of {filteredCases.length}
                      </span>
                      {locked ? (
                        <span className="text-xs bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded-lg font-bold flex items-center gap-1 backdrop-blur-md transition-colors text-white shadow-md">
                          <Smartphone className="w-3.5 h-3.5" /> Pay with M-Pesa
                        </span>
                      ) : (
                        <span className="text-xs bg-blue-600/80 hover:bg-blue-600 px-3 py-1 rounded-lg font-semibold flex items-center gap-1 backdrop-blur-md transition-colors">
                          <Eye className="w-3.5 h-3.5" /> View Case
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {c.modality === 'chest_xray' ? 'Chest X-ray' : 'Head CT'} • {c.difficulty}
                        </span>
                        {locked && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            KES 200 Lifetime Pass
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {c.diagnosis}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                        {locked ? (
                          'Detailed key findings, clinical significance, and reporting template locked. Tap to unlock via M-Pesa.'
                        ) : (
                          <FormattedText text={c.keyFindings[0]} boldClassName="font-bold text-slate-800 dark:text-slate-200" />
                        )}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{locked ? 'Tap to pay via M-Pesa' : 'Click to open detail view'}</span>
                      {locked ? (
                        <Lock className="w-4 h-4 text-amber-500 group-hover:text-emerald-500 transition-colors" />
                      ) : (
                        <Maximize2 className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

