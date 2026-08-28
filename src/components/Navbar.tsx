import React, { useState } from 'react';
import { Stethoscope, Menu, Moon, Sun, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import { ActiveView, Modality } from '../types';
import { SidebarMenu } from './SidebarMenu';

interface NavbarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedModality: Modality;
  setSelectedModality: (modality: Modality) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  reviewedCount: number;
  totalCount: number;
  isPremium: boolean;
  onOpenPaymentModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  darkMode,
  setDarkMode,
  reviewedCount,
  totalCount,
  isPremium,
  onOpenPaymentModal,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-45 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Hamburger menu + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div 
              onClick={() => setActiveView('home')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  RadMed
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium">
                    CME
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  Continuous Medical Education in Radiology
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick actions (M-Pesa button, Dark mode toggle & Review badge) */}
          <div className="flex items-center gap-3">
            {isPremium ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Pro Active</span>
              </div>
            ) : (
              <button
                onClick={onOpenPaymentModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                title="Unlock all cases with M-Pesa"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Unlock (M-Pesa)</span>
              </button>
            )}

            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
              <span>{reviewedCount}/{totalCount} Reviewed</span>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Toggle Dark Mode"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Pull-out Vertical Sidebar Menu */}
      <SidebarMenu
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeView={activeView}
        setActiveView={setActiveView}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        reviewedCount={reviewedCount}
        totalCount={totalCount}
        isPremium={isPremium}
        onOpenPaymentModal={onOpenPaymentModal}
      />
    </>
  );
};


