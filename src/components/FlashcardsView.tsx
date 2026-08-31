import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  RotateCw, 
  Shuffle, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles,
  FileText,
  Brain,
  HelpCircle
} from 'lucide-react';
import { MedicalCase, Modality } from '../types';
import { getSafeImageUrl, handleImageError } from '../lib/imageUtils';

interface FlashcardsViewProps {
  cases: MedicalCase[];
  onBackToHome: () => void;
  onMarkReviewed: (id: string) => void;
  reviewedCases: string[];
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  cases,
  onBackToHome,
  onMarkReviewed,
  reviewedCases,
}) => {
  const [modality, setModality] = useState<Modality>('chest_xray');
  const [deck, setDeck] = useState<MedicalCase[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<string[]>([]);

  useEffect(() => {
    const filtered = cases.filter(c => c.modality === modality);
    setDeck(filtered);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cases, modality]);

  const handleModalityChange = (m: Modality) => {
    setModality(m);
  };

  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const currentCard = deck[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < deck.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // loop back
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleMarkKnown = () => {
    if (currentCard) {
      if (!knownCards.includes(currentCard.id)) {
        setKnownCards([...knownCards, currentCard.id]);
      }
      onMarkReviewed(currentCard.id);
      handleNext();
    }
  };

  if (!currentCard) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold mb-4">No flashcards available</h2>
        <button onClick={onBackToHome} className="px-4 py-2 bg-blue-600 text-white rounded-xl">
          Back Home
        </button>
      </div>
    );
  }

  const isKnown = knownCards.includes(currentCard.id) || reviewedCases.includes(currentCard.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Deck Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Interactive Flashcards
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Card {currentIndex + 1} of {deck.length}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Diagnostic Recall Practice
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Deck Switcher */}
          <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl">
            <button
              onClick={() => handleModalityChange('chest_xray')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                modality === 'chest_xray'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Chest X-ray
            </button>
            <button
              onClick={() => handleModalityChange('head_ct')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                modality === 'head_ct'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" /> Head CT
            </button>
          </div>

          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Shuffle className="w-4 h-4 text-blue-600" /> Shuffle
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-8">
        <div 
          className="bg-emerald-500 h-full transition-all duration-300" 
          style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
        />
      </div>

      {/* Flashcard Box with Flip Animation */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[480px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 cursor-pointer overflow-hidden transition-all duration-500 hover:border-blue-500/50 relative flex flex-col justify-between p-6 sm:p-10 select-none group"
      >
        {/* Top Card Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {currentCard.category}
            </span>
            {isKnown && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Known
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" /> Click anywhere to flip
          </span>
        </div>

        {/* Card Content (Front vs Back) */}
        <div className="my-6 flex flex-col items-center text-center">
          {!isFlipped ? (
            <div className="w-full space-y-6 animate-fadeIn">
              <div className="relative w-full max-w-md h-64 sm:h-72 mx-auto rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-slate-200 dark:border-slate-800">
                <img 
                  src={getSafeImageUrl(currentCard.imageUrl, 800, 80)} 
                  alt={currentCard.imageAlt || currentCard.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e)}
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
              </div>

              <div className="max-w-lg mx-auto">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  <HelpCircle className="w-4 h-4" /> Clinical Prompt
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                  {currentCard.question}
                </h3>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-6 animate-fadeIn text-left max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-center">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                  Primary Diagnosis
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {currentCard.diagnosis}
                </h2>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Key Radiologic Findings
                </h4>
                <ul className="space-y-2">
                  {currentCard.keyFindings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 block mb-1">
                  Teaching Pearl
                </span>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentCard.teachingPoints[0]}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Prev
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkKnown();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark as Known
            </button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
