import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
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
  Check,
  Images,
  ZoomIn,
  Maximize2,
  X,
  Lock,
  Smartphone,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { MedicalCase } from '../types';
import { isCaseLocked, getCaseCategoryIndex, FREE_CXR_LIMIT, FREE_CT_LIMIT } from '../services/paymentService';

interface CaseDetailViewProps {
  currentCase: MedicalCase;
  allCases: MedicalCase[];
  onSelectCase: (c: MedicalCase) => void;
  onBack: () => void;
  onMarkReviewed: (id: string) => void;
  isReviewed: boolean;
  isPremium: boolean;
  onOpenPaymentModal: (category?: string, caseTitle?: string) => void;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({
  currentCase,
  allCases,
  onSelectCase,
  onBack,
  onMarkReviewed,
  isReviewed,
  isPremium,
  onOpenPaymentModal,
}) => {
  const [activeTab, setActiveTab] = useState<'findings' | 'clinical' | 'reporting' | 'teaching' | 'gallery'>('findings');
  const [copied, setCopied] = useState(false);

  const isLocked = isCaseLocked(currentCase, allCases, isPremium);
  const { indexInCategory, totalInCategory } = getCaseCategoryIndex(currentCase, allCases);

  // Gallery image selection state
  const [selectedImgUrl, setSelectedImgUrl] = useState<string>(currentCase.imageUrl);
  const [selectedCaption, setSelectedCaption] = useState<string>(currentCase.imageAlt);


  // Lightbox zoom modal state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchPanStart, setTouchPanStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setSelectedImgUrl(currentCase.imageUrl);
    setSelectedCaption(currentCase.imageAlt || currentCase.title);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentCase]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setInitialPinchDist(dist);
      setInitialZoom(zoomLevel);
      setTouchPanStart(null);
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      setTouchPanStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDist !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / initialPinchDist;
      const newZoom = Math.min(Math.max(1, initialZoom * factor), 4);
      setZoomLevel(newZoom);
      if (newZoom === 1) setPanOffset({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && touchPanStart !== null && zoomLevel > 1) {
      setPanOffset({
        x: e.touches[0].clientX - touchPanStart.x,
        y: e.touches[0].clientY - touchPanStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setInitialPinchDist(null);
    setTouchPanStart(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    const newZoom = Math.min(Math.max(1, zoomLevel + delta), 4);
    setZoomLevel(newZoom);
    if (newZoom === 1) setPanOffset({ x: 0, y: 0 });
  };

  const galleryImages = [
    { url: currentCase.imageUrl, caption: currentCase.imageAlt || currentCase.title },
    ...(currentCase.galleryImages || [])
  ];

  const handlePrevGalleryImage = () => {
    const currentIndex = galleryImages.findIndex(img => img.url === selectedImgUrl);
    const prevIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    setSelectedImgUrl(galleryImages[prevIndex].url);
    setSelectedCaption(galleryImages[prevIndex].caption);
  };

  const handleNextGalleryImage = () => {
    const currentIndex = galleryImages.findIndex(img => img.url === selectedImgUrl);
    const nextIndex = (currentIndex + 1) % galleryImages.length;
    setSelectedImgUrl(galleryImages[nextIndex].url);
    setSelectedCaption(galleryImages[nextIndex].caption);
  };

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleMainTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX);
    } else if (e.touches.length === 2) {
      handleTouchStart(e);
    }
  };

  const handleMainTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      handleTouchMove(e);
    }
  };

  const handleMainTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX !== null && e.changedTouches.length === 1 && galleryImages.length > 1) {
      const diffX = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          handlePrevGalleryImage();
        } else {
          handleNextGalleryImage();
        }
      }
      setTouchStartX(null);
    }
    handleTouchEnd();
  };

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
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Navigation & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Cases
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
            <div className="flex items-center gap-2">
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
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {currentCase.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => onMarkReviewed(currentCase.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isReviewed
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isReviewed ? 'Mastered / Reviewed' : 'Mark as Reviewed'}
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Image Viewer & Gallery */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div 
                  onTouchStart={handleMainTouchStart}
                  onTouchMove={handleMainTouchMove}
                  onTouchEnd={handleMainTouchEnd}
                  className="relative rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-slate-200 dark:border-slate-800 group"
                >
                  <img 
                    src={selectedImgUrl} 
                    alt={selectedCaption}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80'; }}
                    className="w-full h-80 sm:h-[420px] object-cover transition-all duration-300 cursor-zoom-in"
                    onClick={() => {
                      setZoomLevel(1);
                      setLightboxOpen(true);
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none"></div>

                  {/* Gallery Swipe Prev / Next Buttons */}
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePrevGalleryImage(); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-full shadow-lg backdrop-blur-sm transition-all opacity-80 group-hover:opacity-100 z-10"
                        title="Previous Gallery Image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleNextGalleryImage(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-full shadow-lg backdrop-blur-sm transition-all opacity-80 group-hover:opacity-100 z-10"
                        title="Next Gallery Image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  
                  {/* Zoom Action Overlay Button */}
                  <button
                    onClick={() => {
                      setZoomLevel(1);
                      setLightboxOpen(true);
                    }}
                    className="absolute top-3 left-3 bg-slate-900/80 hover:bg-slate-900 text-white p-2.5 rounded-xl shadow-lg backdrop-blur-sm transition-all flex items-center gap-1.5 text-xs font-semibold z-10"
                    title="Click to Zoom & Inspect Finer Details"
                  >
                    <ZoomIn className="w-4 h-4 text-blue-400" />
                    <span>Zoom</span>
                  </button>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs font-medium opacity-90">{selectedCaption}</p>
                    {galleryImages.length > 1 && (
                      <p className="text-[10px] text-blue-400 mt-0.5">Swipe left/right or use arrows to view gallery photos ({galleryImages.findIndex(i => i.url === selectedImgUrl) + 1} of {galleryImages.length})</p>
                    )}
                  </div>
                </div>

                {/* Dedicated Bottom Title & Diagnosis Banner */}
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400 block mb-0.5">Image Title & Diagnosis</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{currentCase.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{selectedCaption}</p>
                </div>

                {/* Gallery Thumbnails Strip */}
                {galleryImages.length > 1 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-medium">
                      <span>Condition Image Gallery ({galleryImages.length} views)</span>
                      <span className="text-blue-600 dark:text-blue-400">Click to preview</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {galleryImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedImgUrl(img.url);
                            setSelectedCaption(img.caption);
                          }}
                          className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                            selectedImgUrl === img.url
                              ? 'border-blue-600 ring-2 ring-blue-600/30 scale-105'
                              : 'border-slate-300 dark:border-slate-700 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prev / Next Case Navigation */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex <= 0}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs disabled:opacity-40 hover:bg-slate-200 transition-all flex items-center justify-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous Case
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex >= sameModalityCases.length - 1}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs disabled:opacity-40 hover:bg-slate-200 transition-all flex items-center justify-center gap-1"
                  >
                    Next Case <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Column: Case Details & Interactive Tabs */}
              <div className="lg:col-span-7 flex flex-col">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                    <span>{currentCase.modality === 'chest_xray' ? 'Chest Radiography' : 'Neurological Computed Tomography'}</span>
                    <span>•</span>
                    <span>Difficulty: {currentCase.difficulty}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
                    {currentCase.title}
                  </h1>
                  
                  {/* Clinical Question Box */}
                  <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 p-4 rounded-2xl mb-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">
                      <Stethoscope className="w-4 h-4" /> Clinical Presentation & Question
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {currentCase.question}
                    </p>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveTab('findings')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      activeTab === 'findings'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Key Findings & Diagnosis
                  </button>
                  <button
                    onClick={() => setActiveTab('clinical')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      activeTab === 'clinical'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> Clinical Significance
                  </button>
                  <button
                    onClick={() => setActiveTab('reporting')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      activeTab === 'reporting'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Reporting Template
                  </button>
                  <button
                    onClick={() => setActiveTab('teaching')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      activeTab === 'teaching'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5" /> Teaching Points
                  </button>
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      activeTab === 'gallery'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Images className="w-3.5 h-3.5" /> Gallery ({galleryImages.length})
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 space-y-6 relative">
                  {isLocked ? (
                    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/70 border border-amber-400/40 text-white shadow-2xl text-center space-y-5">
                      <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-400/30 shadow-lg">
                        <Lock className="w-8 h-8" />
                      </div>

                      <div className="max-w-md mx-auto space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                          <Lock className="w-3.5 h-3.5" /> Premium Case
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                          Unlock Diagnosis & Reporting Template
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          Free access includes {FREE_CXR_LIMIT} Chest X-rays & {FREE_CT_LIMIT} Head CT scans. Unlock complete radiologist findings, teaching points, differential diagnoses, and standardized templates with lifetime access.
                        </p>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          onClick={() => onOpenPaymentModal(currentCase.category, currentCase.title)}
                          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Smartphone className="w-4 h-4" /> Pay KES 1,000 via M-Pesa
                        </button>
                        <button
                          onClick={() => onOpenPaymentModal(currentCase.category, currentCase.title)}
                          className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700 cursor-pointer"
                        >
                          Enter Transaction Code
                        </button>
                      </div>

                      <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Instant automated STK Push via Safaricom Daraja API</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Findings Tab */}
                      {activeTab === 'findings' && (

                    <div className="space-y-6 animate-fadeIn">
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
                          Confirmed Diagnosis
                        </span>
                        <h2 className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200">
                          {currentCase.diagnosis}
                        </h2>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-600" /> Key Radiological Findings
                        </h3>
                        <ul className="space-y-2.5">
                          {currentCase.keyFindings.map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300">
                              <span className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></span>
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Clinical Significance Tab */}
                  {activeTab === 'clinical' && (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-5 rounded-2xl">
                        <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" /> Clinical Significance & Urgency
                        </h3>
                        <p className="text-sm text-amber-900/80 dark:text-amber-300 leading-relaxed">
                          {currentCase.clinicalSignificance}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
                          Differential Diagnoses to Consider
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {currentCase.differentialDiagnosis.map((diff, idx) => (
                            <span key={idx} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs border border-slate-200 dark:border-slate-700">
                              {diff}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reporting Template Tab */}
                  {activeTab === 'reporting' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" /> Standardized Structured Report Template
                        </h3>
                        <button
                          onClick={handleCopyReport}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? 'Copied to Clipboard!' : 'Copy Template'}
                        </button>
                      </div>

                      <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
                        {currentCase.reportingTemplate}
                      </div>
                    </div>
                  )}

                  {/* Teaching Points Tab */}
                  {activeTab === 'teaching' && (
                    <div className="space-y-6 animate-fadeIn">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-500" /> Core Educational Pearls
                        </h3>
                        <ul className="space-y-3">
                          {currentCase.teachingPoints.map((tp, idx) => (
                            <li key={idx} className="flex items-start gap-3 bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/40 text-sm text-slate-800 dark:text-slate-200">
                              <span className="font-bold text-purple-600 dark:text-purple-400">0{idx + 1}.</span>
                              <span>{tp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-lg">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-200 mb-1">
                          <Sparkles className="w-4 h-4" /> CME Expert Pearl Tip
                        </div>
                        <p className="text-sm font-medium leading-relaxed">
                          {currentCase.cmeTip}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Gallery Tab */}
                  {activeTab === 'gallery' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                          <Images className="w-4 h-4 text-blue-600" /> Immersive Condition Image Gallery
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                          Explore multiple anatomical views, projections, and radiological cuts for {currentCase.title}. Click any image to zoom and inspect finer details.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {galleryImages.map((img, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              setSelectedImgUrl(img.url);
                              setSelectedCaption(img.caption);
                              setZoomLevel(1);
                              setLightboxOpen(true);
                            }}
                            className="group cursor-pointer bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all shadow-sm"
                          >
                            <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-950 mb-2">
                              <img src={img.url} alt={img.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute top-2 right-2 bg-slate-900/80 text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                                <ZoomIn className="w-3 h-3 text-blue-400" /> View #{idx + 1}
                              </div>
                            </div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                              {img.caption}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                    </>
                  )}

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom Modal for Finer Details */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 overflow-auto">
          <div className="relative w-full max-w-5xl flex flex-col items-center justify-center min-h-[90vh]">
            
            {/* Top Lightbox Controls Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-800 text-white">
              <div className="flex items-center gap-3">
                <Maximize2 className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-semibold text-slate-300">High-Resolution Radiograph / CT Zoom Viewer (Zoom: {Math.round(zoomLevel * 100)}%)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel((prev) => Math.max(1, prev - 0.5))}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors"
                  title="Zoom Out"
                >
                  -
                </button>
                <button
                  onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.5))}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-colors ml-4"
                  title="Close Zoom Viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Zoomable Image Container */}
            <div 
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative overflow-hidden max-h-[75vh] max-w-full rounded-2xl border border-slate-800 bg-slate-950 p-2 mt-16 flex items-center justify-center select-none group cursor-grab active:cursor-grabbing"
            >
              <img
                src={selectedImgUrl}
                alt={selectedCaption}
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80'; }}
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transition: isDragging || initialPinchDist ? 'none' : 'transform 0.15s ease-out'
                }}
                className="max-h-[68vh] object-contain origin-center pointer-events-none"
              />

              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrevGalleryImage(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-900/90 hover:bg-slate-800 text-white p-3 rounded-full shadow-xl transition-all z-10"
                    title="Previous Gallery Image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNextGalleryImage(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900/90 hover:bg-slate-800 text-white p-3 rounded-full shadow-xl transition-all z-10"
                    title="Next Gallery Image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Caption / Diagnosis Banner */}
            <div className="w-full mt-3 bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-800 text-white flex items-center justify-between shadow-xl">
              <div>
                <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block">Case Diagnosis & Image Caption</span>
                <h4 className="text-sm font-bold text-slate-100">{selectedCaption} ({currentCase.title})</h4>
              </div>
              {galleryImages.length > 1 && (
                <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                  Gallery View {galleryImages.findIndex(i => i.url === selectedImgUrl) + 1} of {galleryImages.length}
                </div>
              )}
            </div>

            <div className="mt-4 text-center text-xs text-slate-400 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800">
              Pinch or mouse wheel to zoom, click and drag (or touch and drag) to move around and inspect different parts of the image when zoomed in.
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
