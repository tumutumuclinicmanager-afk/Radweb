import React, { useState, useEffect } from 'react';
import { ActiveView, Modality, MedicalCase } from './types';
import { MEDICAL_CASES } from './data/casesData';
import { fetchCases, addCaseToFirestore, deleteCaseFromFirestore } from './services/casesService';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { CarouselView } from './components/CarouselView';
import { CaseDetailView } from './components/CaseDetailView';
import { FlashcardsView } from './components/FlashcardsView';
import { DisclaimerModal } from './components/DisclaimerModal';
import { AdminView } from './components/AdminView';
import { InterpretationView } from './components/InterpretationView';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [selectedModality, setSelectedModality] = useState<Modality>('chest_xray');
  const [cases, setCases] = useState<MedicalCase[]>(MEDICAL_CASES);

  useEffect(() => {
    fetchCases().then((fetched) => {
      if (fetched && fetched.length > 0) {
        const unique = Array.from(new Map(fetched.map(c => [c.id, c])).values());
        setCases(unique);
      }
    });
  }, []);

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

  const handleAddCase = async (newCase: MedicalCase) => {
    try {
      await addCaseToFirestore(newCase);
      setCases((prev) => {
        const filtered = prev.filter(c => c.id !== newCase.id);
        return [newCase, ...filtered];
      });
    } catch (err) {
      console.error(err);
      alert('Failed to save case to Firebase database.');
    }
  };

  const handleDeleteCase = async (id: string) => {
    try {
      await deleteCaseFromFirestore(id);
      setCases((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete case from Firebase database.');
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

      {/* Main Views or Full-Page Case View */}
      <main>
        {selectedCaseForDetail ? (
          <CaseDetailView
            currentCase={selectedCaseForDetail}
            allCases={cases}
            onSelectCase={(c) => setSelectedCaseForDetail(c)}
            onBack={() => setSelectedCaseForDetail(null)}
            onMarkReviewed={handleMarkReviewed}
            isReviewed={reviewedCases.includes(selectedCaseForDetail.id)}
          />
        ) : (
          <>
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
          </>
        )}
      </main>
    </div>
  );
}
