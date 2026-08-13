import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Layers, 
  Activity, 
  ShieldCheck, 
  Eye, 
  Sparkles, 
  ArrowRight, 
  HelpCircle,
  FileText,
  Sliders,
  ChevronRight
} from 'lucide-react';

interface InterpretationViewProps {
  onBackToCarousel: () => void;
  onBackToHome: () => void;
}

export const InterpretationView: React.FC<InterpretationViewProps> = ({
  onBackToCarousel,
  onBackToHome,
}) => {
  const [activeStep, setActiveStep] = useState<string>('quality');

  const steps = [
    { id: 'quality', label: '1. Technical Quality (RIP)', icon: Sliders },
    { id: 'a', label: 'A - Airway & Trachea', icon: Activity },
    { id: 'b', label: 'B - Bones & Soft Tissues', icon: Layers },
    { id: 'c', label: 'C - Cardiac Silhouette', icon: ShieldCheck },
    { id: 'd', label: 'D - Diaphragm & Pleura', icon: Eye },
    { id: 'e', label: 'E - Effusions & Edges', icon: CheckCircle2 },
    { id: 'f', label: 'F - Fields & Everything Else', icon: Sparkles },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl mb-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wide uppercase">
              Clinical Mastery Guide
            </span>
            <span className="text-xs text-slate-300">• Systematic CXR Reading Protocol</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            Chest X-Ray Interpretation <br />
            <span className="text-blue-400">The ABCDEF Method</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Master the gold-standard systematic approach used by radiologists and clinicians worldwide to evaluate chest radiographs without missing subtle life-threatening pathology.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onBackToCarousel}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" /> Practice Cases in Carousel <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onBackToHome}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm transition-all border border-white/20"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xl border border-slate-200 dark:border-slate-800 sticky top-24">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-3">
              Step-by-Step Protocol
            </h3>
            <div className="space-y-1">
              {steps.map((s) => {
                const IconComponent = s.icon;
                const isActive = activeStep === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStep(s.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                    <span className="truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Guide Content */}
        <div className="lg:col-span-3 space-y-8">
          {activeStep === 'quality' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 animate-fade-in space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">1. Technical Quality Assessment (RIP)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Always evaluate technical adequacy before interpreting findings</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <div className="text-blue-600 dark:text-blue-400 font-bold text-lg mb-2">R - Rotation</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Check the medial ends of the clavicles relative to the spinous process. If the spinous process is equidistant between both clavicular heads, the patient is not rotated. Rotation can artificially distort cardiac borders and mediastinal widths.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <div className="text-blue-600 dark:text-blue-400 font-bold text-lg mb-2">I - Inspiration</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Count the ribs on an upright PA chest X-ray. Adequate inspiration requires visualization of <span className="font-bold">9 to 10 posterior ribs</span> or 5 to 6 anterior ribs above the diaphragm. Poor inspiration crowds lung markings and mimics consolidation.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <div className="text-blue-600 dark:text-blue-400 font-bold text-lg mb-2">P - Projection & Penetration</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Verify PA vs AP (AP magnifies the heart). For penetration, thoracic vertebral bodies should be faintly visible behind the heart. Over-penetrated films make lung fields look too dark; under-penetrated make them falsely opaque.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                  <span className="font-bold">Pro Tip:</span> Portable AP chest X-rays taken in ICU patients almost always exaggerate cardiac size and obscure lower lobe pathologies. Always note if a radiograph is portable (AP).
                </div>
              </div>
            </div>
          )}

          {activeStep === 'a' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 animate-fade-in space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">A - Airway & Trachea</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Evaluate patency, alignment, and central structures</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  Trace the column of dark air (trachea) down from the neck into the thorax. The trachea should appear as a dark midline tubular lucency running straight down.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Key Checks:</h4>
                    <ul className="space-y-2 text-xs">
                      <li className="flex items-center gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-blue-500" /> Is the trachea midline or pushed/pulled to one side?
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-blue-500" /> Check the carina (where the trachea bifurcates into right and left main bronchi).
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-blue-500" /> Look for foreign bodies, tracheal narrowing, or extrinsic compression.
                      </li>
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-300 mb-2">Pathology Clues:</h4>
                    <p className="text-xs text-emerald-800 dark:text-emerald-200">
                      Tracheal deviation away from a lesion indicates mass effect (tension pneumothorax, large pleural effusion). Deviation toward a lesion indicates volume loss (atelectasis, pulmonary fibrosis).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'b' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 animate-fade-in space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">B - Bones & Soft Tissues</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Inspect clavicles, ribs, spine, and chest wall soft tissues</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  Bone windows and careful tracing can reveal hidden injuries that explain the patient's symptoms (e.g., rib fractures causing pleuritic pain or pneumothorax).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">What to Inspect:</h4>
                    <ul className="space-y-2 text-xs">
                      <li>• Clavicles: Check for fractures or old healing malunions.</li>
                      <li>• Ribs: Systematically follow each rib from spine to sternum looking for cortical breaks.</li>
                      <li>• Spine: Thoracic vertebrae should maintain normal height and alignment.</li>
                      <li>• Soft Tissues: Look for subcutaneous emphysema (crepitus) or breast shadows.</li>
                    </ul>
                  </div>
                  <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                    <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-2">Common Pitfall:</h4>
                    <p className="text-xs text-purple-800 dark:text-purple-200">
                      Mistaking nutrient foramina or normal skin folds for rib fractures. Always trace the smooth cortical outline of the bone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'c' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 animate-fade-in space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">C - Cardiac Silhouette & Mediastinum</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Evaluate heart size, contours, and mediastinal width</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  The cardiac shadow is evaluated using the <span className="font-bold">Cardiothoracic Ratio (CTR)</span>. On an upright PA chest X-ray, the maximum transverse diameter of the heart should be <span className="font-bold">less than 50%</span> of the internal thoracic cage diameter.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Mediastinal Borders:</h4>
                    <p className="text-xs leading-relaxed">
                      Check the right atrium border on the right and left ventricle/aortic knob on the left. Ensure the superior mediastinum is not widened (&gt; 8 cm on PA view), which could suggest aortic dissection, aneurysm, or hemorrhage.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                    <h4 className="font-bold text-rose-900 dark:text-rose-300 mb-2">Silhouette Sign:</h4>
                    <p className="text-xs text-rose-800 dark:text-rose-200">
                      If a cardiac border is obscured (e.g., right heart border in right middle lobe pneumonia), it tells you the pathology is anatomically adjacent to that heart border.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'd' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 animate-fade-in space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">D - Diaphragm & Pleura</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Inspect hemidiaphragm contours and costophrenic angles</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  The right hemidiaphragm is typically slightly higher than the left due to the underlying liver. Both should appear as smooth, dome-shaped radiopaque lines.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Costophrenic Angles:</h4>
                    <p className="text-xs leading-relaxed">
                      Lateral and posterior costophrenic angles must be sharp and acute. Blunting of these angles indicates pleural effusion, pleural thickening, or scarring.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                    <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-2">Subdiaphragmatic Check:</h4>
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      Always check beneath the right hemidiaphragm for free air (pneumoperitoneum), which indicates hollow viscus perforation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'e' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 animate-fade-in space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">E - Effusions & Edges (Pleura & Fissures)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Scan pleural spaces, fissures, and lung margins</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  Trace along the inner chest wall to ensure lung markings extend all the way to the parietal pleura, ruling out pneumothorax (no lung markings beyond the visceral pleural line).
                </p>
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">Fissures & Fluid:</h4>
                  <p className="text-xs leading-relaxed">
                    Look at the minor (horizontal) fissure in the right mid-lung. Thickening of this fissure can indicate fluid overload or pleural inflammation. Check for loculated effusions or fluid tracking up the fissures.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'f' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 animate-fade-in space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">F - Fields & Everything Else (Parenchyma & Devices)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Examine lung zones, vascular markings, tubes, and lines</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  Divide each lung into upper, middle, and lower zones. Compare left and right symmetrically. Look for focal consolidation, interstitial opacities, nodules, or masses.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Medical Hardware Check:</h4>
                    <p className="text-xs leading-relaxed">
                      Verify endotracheal tube (ETT) tip placement (should be ~3-5 cm above the carina), central venous catheter (CVC) tips in the cavoatrial junction, and nasogastric (NG) tube passing below the diaphragm.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                    <h4 className="font-bold text-sky-900 dark:blind-sky-300 mb-2">Final Review:</h4>
                    <p className="text-xs text-sky-800 dark:text-sky-200">
                      Always check the "blind spots" behind the heart, under the diaphragm, and at the lung apices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
