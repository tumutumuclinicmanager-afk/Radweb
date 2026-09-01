import React from 'react';
import { ShieldAlert, BookOpen, Stethoscope, CheckCircle2, Award, X, Phone, Mail, Headphones, MessageSquare } from 'lucide-react';

interface DisclaimerModalProps {
  onClose: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onClose }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                About RadCarousel & CME Guidelines
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Continuous Medical Education for Chest X-Ray and Head CT Interpretation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300">
          
          {/* Purpose */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> Educational Purpose & Target Audience
            </h2>
            <p className="leading-relaxed">
              RadMed is designed as a high-yield learning and recall tool for medical students, clinical interns, emergency medicine residents, ICU fellows, and practicing clinicians. By presenting curated radiographic and cross-sectional brain CT cases paired with structured reporting templates and teaching pearls, learners build rapid diagnostic pattern recognition.
            </p>
          </div>

          {/* Core Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Case Gallery Learning Mode
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Swipe through high-resolution medical imaging cases categorized by normal variants, common pathology, and emergency life-threatening findings. Tap any case to examine key findings, clinical significance, and reporting language.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Active Recall Flashcards
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Test active recall with flip cards. Practice differential diagnosis and track your mastery progress across chest and neuroimaging decks.
              </p>
            </div>
          </div>

          {/* Disclaimer Box */}
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-base text-rose-700 dark:text-rose-300">
              <ShieldAlert className="w-5 h-5" /> Important Medical Disclaimer
            </div>
            <p className="text-xs sm:text-sm leading-relaxed">
              RadCarousel is intended solely for <strong>continuous medical education and academic training purposes</strong>. It is <strong>not</strong> a medical device and must never be used as a substitute for formal radiology training, professional clinical judgment, or official diagnostic interpretation by a board-certified radiologist. Patient care decisions must always be based on comprehensive clinical evaluation and official radiology reports.
            </p>
          </div>

          {/* Academic Support & Clinical Helpline */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
              <Headphones className="w-5 h-5 text-blue-600 dark:text-blue-400" /> RadMed Helpline & Support
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              For case submissions, residency curriculum integration, payment confirmation, or clinical feedback, contact the administrative and clinical support desk:
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs">
              <a
                href="tel:+254112294835"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold hover:border-emerald-500 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-500" /> +254 112 294 835
              </a>
              <a
                href="https://wa.me/254112294835"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp Us
              </a>
              <a
                href="mailto:radmedadmin@gmail.com"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-semibold hover:border-blue-500 transition-colors"
              >
                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" /> radmedadmin@gmail.com
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-md"
          >
            Got it, return to app
          </button>
        </div>

      </div>
    </div>
  );
};
