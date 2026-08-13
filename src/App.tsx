import React, { useState, useEffect } from 'react';
import { ActiveView, Modality, MedicalCase } from './types';
import { MEDICAL_CASES } from './data/casesData';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { CarouselView } from './components/CarouselView';
import { DetailModal } from './components/DetailModal';
import { FlashcardsView } from './components/FlashcardsView';
import { DisclaimerModal } from './components/DisclaimerModal';
import { AdminView } from './components/AdminView';
import { InterpretationView } from './components/InterpretationView';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [selectedModality, setSelectedModality] = useState<Modality>('chest_xray');
  const [cases, setCases] = useState<MedicalCase[]>(() => {
    try {
      const saved = localStorage.getItem('radcarousel_custom_cases');
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...MEDICAL_CASES, ...parsed];
      }
    } catch {
      // ignore
    }
    return MEDICAL_CASES;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [reviewedCases, setReviewedCases] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('radcarousel_reviewed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedCaseForDetail, setSelectedCaseForDetail] = useState<MedicalCase | null>(null);

  // Sync dark mode class with html element
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Save reviewed cases to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('radcarousel_reviewed', JSON.stringify(reviewedCases));
    } catch {
      // ignore
    }
  }, [reviewedCases]);

  const handleMarkReviewed = (id: string) => {
    if (!reviewedCases.includes(id)) {
      setReviewedCases([...reviewedCases, id]);
    }
  };

  const handleAddCase = (newCase: MedicalCase) => {
    const updated = [newCase, ...cases];
    setCases(updated);
    // Save only custom cases to localStorage
    const customCases = updated.filter(c => c.id.startsWith('custom-'));
    try {
      localStorage.setItem('radcarousel_custom_cases', JSON.stringify(customCases));
    } catch {
      // ignore
    }
  };

  const handleDeleteCase = (id: string) => {
    const updated = cases.filter(c => c.id !== id);
    setCases(updated);
    const customCases = updated.filter(c => c.id.startsWith('custom-'));
    try {
      localStorage.setItem('radcarousel_custom_cases', JSON.stringify(customCases));
    } catch {
      // ignore
    }
  };

  return (
    <div className={`min-h-screen font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors ${darkMode ? 'dark' : ''}`}>
      {/* Navigation Bar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        selectedModality={selectedModality}
        setSelectedModality={setSelectedModality}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        reviewedCount={reviewedCases.length}
        totalCount={cases.length}
      />

      {/* Main Views */}
      <main>
        {activeView === 'home' && (
          <HomeScreen
            setActiveView={setActiveView}
            setSelectedModality={setSelectedModality}
            cases={cases}
            onSelectCase={(c) => setSelectedCaseForDetail(c)}
            reviewedCases={reviewedCases}
          />
        )}

        {activeView === 'carousel' && (
          <CarouselView
            cases={cases}
            selectedModality={selectedModality}
            setSelectedModality={setSelectedModality}
            onSelectCase={(c) => setSelectedCaseForDetail(c)}
            reviewedCases={reviewedCases}
          />
        )}

        {activeView === 'flashcards' && (
          <FlashcardsView
            cases={cases}
            onBackToHome={() => setActiveView('home')}
            onMarkReviewed={handleMarkReviewed}
            reviewedCases={reviewedCases}
          />
        )}

        {activeView === 'disclaimer' && (
          <DisclaimerModal
            onClose={() => setActiveView('home')}
          />
        )}

        {activeView === 'admin' && (
          <AdminView
            cases={cases}
            onAddCase={handleAddCase}
            onDeleteCase={handleDeleteCase}
            onBackToHome={() => setActiveView('home')}
          />
        )}

        {activeView === 'interpretation' && (
          <InterpretationView
            onBackToCarousel={() => setActiveView('carousel')}
            onBackToHome={() => setActiveView('home')}
          />
        )}
      </main>

      {/* Detail Modal View */}
      {selectedCaseForDetail && (
        <DetailModal
          currentCase={selectedCaseForDetail}
          allCases={cases}
          onSelectCase={(c) => setSelectedCaseForDetail(c)}
          onClose={() => setSelectedCaseForDetail(null)}
          onMarkReviewed={handleMarkReviewed}
          isReviewed={reviewedCases.includes(selectedCaseForDetail.id)}
        />
      )}
    </div>
  );
}
