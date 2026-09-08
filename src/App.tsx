import React, { useState, useEffect } from 'react';
import { ActiveView, Modality, MedicalCase, UserProfile } from './types';
import { fetchCases, addCaseToFirestore, deleteCaseFromFirestore, sortCasesDeterministically, triggerBackgroundFullCasesPrefetch } from './services/casesService';
import { getCasesFromIndexedDB, saveCasesToIndexedDB } from './services/caseDb';
import { getIsPremiumStatus, markUserAsPremium, clearPremiumStatus } from './services/paymentService';
import { subscribeToAuth, updateUserPremiumStatusInFirestore } from './services/authService';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { CarouselView } from './components/CarouselView';
import { CaseDetailView } from './components/CaseDetailView';
import { FlashcardsView } from './components/FlashcardsView';
import { DisclaimerModal } from './components/DisclaimerModal';
import { AdminView } from './components/AdminView';
import { InterpretationView } from './components/InterpretationView';
import { ProgressDashboard } from './components/ProgressDashboard';
import { MpesaPaymentModal } from './components/MpesaPaymentModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [selectedModality, setSelectedModality] = useState<Modality>('chest_xray');
  const [cases, setCases] = useState<MedicalCase[]>(() => {
    try {
      const cached = localStorage.getItem('radmed_all_cases_initial_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return sortCasesDeterministically(
            parsed.filter((c: any) => c && c.id && !c.id.startsWith('baseline-') && !c.id.startsWith('sample-') && !c.id.startsWith('mock-'))
          );
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // User Authentication & Lifetime Pro Access State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(() => getIsPremiumStatus());
  
  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalCategory, setPaymentModalCategory] = useState<string | undefined>(undefined);
  const [paymentModalTitle, setPaymentModalTitle] = useState<string | undefined>(undefined);

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [authModalPostPayment, setAuthModalPostPayment] = useState(false);
  const [pendingReceipt, setPendingReceipt] = useState<string | undefined>(undefined);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (user) {
        const hasPremium = Boolean(user.isPremium);
        setIsPremium(hasPremium);
        if (hasPremium) {
          markUserAsPremium(user.mpesaReceiptNumber, user.phoneNumber);
        } else {
          clearPremiumStatus();
        }
      } else {
        setIsPremium(getIsPremiumStatus());
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleOpenPaymentModal = (category?: string, caseTitle?: string) => {
    setPaymentModalCategory(category);
    setPaymentModalTitle(caseTitle);
    setPaymentModalOpen(true);
  };

  const handleOpenAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalPostPayment(false);
    setPendingReceipt(undefined);
    setAuthModalOpen(true);
  };

  const handlePaymentSuccess = async (createdProfile?: UserProfile) => {
    markUserAsPremium();
    setIsPremium(true);

    if (createdProfile) {
      setCurrentUser(createdProfile);
    } else if (currentUser && currentUser.uid) {
      // If user was already logged in as a free account, upgrade them in Firestore to lifetime premium
      await updateUserPremiumStatusInFirestore(currentUser.uid, {
        isPremium: true,
      });
      setCurrentUser({
        ...currentUser,
        isPremium: true,
      });
    }
  };

  const [isLoadingCases, setIsLoadingCases] = useState<boolean>(() => cases.length === 0);

  const handleRefreshCases = async () => {
    try {
      const fetched = await fetchCases();
      const sorted = sortCasesDeterministically(fetched);
      setCases(sorted);
      setIsLoadingCases(false);

      // Persist full authentic cases to high-capacity IndexedDB for instant future startup
      await saveCasesToIndexedDB(sorted);

      // Save lightweight manifest to localStorage for emergency fallback
      try {
        const lightweight = sorted.map(c => {
          const { galleryImages, ...rest } = c;
          return {
            ...rest,
            galleryCount: c.galleryCount || (Array.isArray(galleryImages) ? galleryImages.length : 0),
          };
        });
        localStorage.setItem('radmed_all_cases_initial_cache', JSON.stringify(lightweight));
      } catch {}

      // Asynchronously prefetch complete gallery stacks in the background
      triggerBackgroundFullCasesPrefetch((fullCases) => {
        setCases(sortCasesDeterministically(fullCases));
      });
    } catch (err) {
      console.warn("Failed to retrieve cases on startup:", err);
      // Display content immediately using IndexedDB if network fails
      try {
        const idbCached = await getCasesFromIndexedDB();
        if (idbCached && idbCached.length > 0) {
          setCases(sortCasesDeterministically(idbCached));
        }
      } catch (cacheErr) {
        console.error("IndexedDB fallback load error:", cacheErr);
      } finally {
        setIsLoadingCases(false);
      }
    }
  };

  useEffect(() => {
    // 1. Immediate sub-15ms local cache read from IndexedDB for zero perceived wait time
    getCasesFromIndexedDB().then((cached) => {
      if (cached && cached.length > 0) {
        setCases(sortCasesDeterministically(cached));
        setIsLoadingCases(false);
      }
    }).catch(() => {});

    // 2. Perform fast background synchronization with backend API / Firestore
    handleRefreshCases();
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

  const handleToggleReviewed = (id: string) => {
    if (reviewedCases.includes(id)) {
      setReviewedCases(reviewedCases.filter((item) => item !== id));
    } else {
      setReviewedCases([...reviewedCases, id]);
    }
  };

  const handleResetProgress = () => {
    setReviewedCases([]);
  };

  const handleAddCase = async (newCase: MedicalCase) => {
    try {
      await addCaseToFirestore(newCase);
      const refreshed = await fetchCases();
      setCases(sortCasesDeterministically(refreshed));
    } catch (err) {
      console.error(err);
      alert('Failed to save case to Firebase database.');
    }
  };

  const handleDeleteCase = async (id: string) => {
    try {
      await deleteCaseFromFirestore(id);
      const refreshed = await fetchCases();
      setCases(sortCasesDeterministically(refreshed));
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
        isPremium={isPremium}
        onOpenPaymentModal={() => handleOpenPaymentModal()}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
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
            isPremium={isPremium}
            onOpenPaymentModal={handleOpenPaymentModal}
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
                isPremium={isPremium}
                onOpenPaymentModal={handleOpenPaymentModal}
                isLoadingCases={isLoadingCases}
              />
            )}

            {activeView === 'cases' && (
              <CarouselView
                cases={cases}
                selectedModality={selectedModality}
                setSelectedModality={setSelectedModality}
                onSelectCase={(c) => setSelectedCaseForDetail(c)}
                reviewedCases={reviewedCases}
                isPremium={isPremium}
                onOpenPaymentModal={handleOpenPaymentModal}
              />
            )}

            {activeView === 'flashcards' && (
              <FlashcardsView
                cases={cases}
                onBackToHome={() => setActiveView('home')}
                onMarkReviewed={handleMarkReviewed}
                reviewedCases={reviewedCases}
                isPremium={isPremium}
                onOpenPaymentModal={handleOpenPaymentModal}
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
                onRefreshCases={handleRefreshCases}
              />
            )}

            {activeView === 'interpretation' && (
              <InterpretationView
                onBackToCarousel={() => setActiveView('cases')}
                onBackToHome={() => setActiveView('home')}
              />
            )}

            {activeView === 'progress' && (
              <ProgressDashboard
                cases={cases}
                reviewedCases={reviewedCases}
                onSelectCase={(c) => setSelectedCaseForDetail(c)}
                onMarkReviewed={handleMarkReviewed}
                onToggleReviewed={handleToggleReviewed}
                onResetProgress={handleResetProgress}
                onBackToHome={() => setActiveView('home')}
                onOpenPaymentModal={handleOpenPaymentModal}
                isPremium={isPremium}
                currentUser={currentUser}
              />
            )}
          </>
        )}
      </main>

      {/* Lipa Na M-Pesa Payment Modal */}
      <MpesaPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onOpenLoginModal={() => {
          setPaymentModalOpen(false);
          handleOpenAuthModal('login');
        }}
        selectedCategory={paymentModalCategory}
        caseTitle={paymentModalTitle}
      />

      {/* Auth Modal (Login / Register / Post-Payment Linking) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={(user) => {
          setCurrentUser(user);
          if (user?.isPremium) {
            setIsPremium(true);
            markUserAsPremium(user.mpesaReceiptNumber, user.phoneNumber);
          } else {
            setIsPremium(false);
            clearPremiumStatus();
          }
        }}
        defaultTab={authModalTab}
        isPostPayment={authModalPostPayment}
        mpesaReceipt={pendingReceipt}
        onOpenPayment={() => {
          setAuthModalOpen(false);
          handleOpenPaymentModal();
        }}
      />

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/60 mt-12">
        <p>Made by Godfrey Novamed Solutions &copy; {new Date().getFullYear()} — Advanced Medical Imaging & Diagnostic Intelligence</p>
      </footer>
    </div>
  );
}
