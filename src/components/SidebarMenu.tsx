import React from 'react';
import { Stethoscope, BookOpen, Layers, Moon, Sun, Home, ShieldAlert, Lock, X, CheckCircle2, Smartphone, ShieldCheck, Zap } from 'lucide-react';
import { ActiveView } from '../types';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  reviewedCount: number;
  totalCount: number;
  isPremium: boolean;
  onOpenPaymentModal: () => void;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  isOpen,
  onClose,
  activeView,
  setActiveView,
  darkMode,
  setDarkMode,
  reviewedCount,
  totalCount,
  isPremium,
  onOpenPaymentModal,
}) => {
  const progressPercentage = Math.round((reviewedCount / totalCount) * 100) || 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Pull-out Sidebar */}
      <div className="relative w-80 max-w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                RadMed
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium">
                  CME
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Medical Imaging Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <button
            onClick={() => { setActiveView('home'); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeView === 'home'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home & Case Library</span>
          </button>

          <button
            onClick={() => { setActiveView('interpretation'); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeView === 'interpretation'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>CXR Interpretation Guide</span>
          </button>

          <button
            onClick={() => { setActiveView('flashcards'); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeView === 'flashcards'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span>Flashcard Practice</span>
          </button>

          <button
            onClick={() => { setActiveView('admin'); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeView === 'admin'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Lock className="w-5 h-5" />
            <span>Admin Case Upload</span>
          </button>

          <button
            onClick={() => { setActiveView('disclaimer'); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeView === 'disclaimer'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            <span>Clinical Disclaimer & Info</span>
          </button>

          {/* M-Pesa Premium status box in sidebar */}
          <div className="pt-2">
            {!isPremium ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/40 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Lipa Na M-Pesa
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
                  5 free cases per category. Pay <strong>KES 1,000</strong> once for lifetime unlimited access.
                </p>
                <button
                  onClick={() => { onClose(); onOpenPaymentModal(); }}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" /> Pay KES 1,000
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>RadMed Pro • Lifetime Access</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer / Stats & Theme */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          
          {/* Progress Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Mastery Progress
              </span>
              <span>{reviewedCount}/{totalCount} Cases</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Dark Appearance</span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-xs font-medium"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              <span>{darkMode ? 'Light' : 'Dark'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

