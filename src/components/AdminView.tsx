import React, { useState } from 'react';
import { MedicalCase, Modality } from '../types';
import { 
  Lock, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  AlertCircle, 
  LogOut, 
  ArrowLeft, 
  Edit3, 
  Upload, 
  X, 
  Save, 
  Sparkles, 
  Bot, 
  Scan, 
  Loader2, 
  BookOpen, 
  Layers,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { researchCaseWithAI, batchResearchCasesWithAI } from '../services/aiAgentService';

interface AdminViewProps {
  cases: MedicalCase[];
  onAddCase: (newCase: MedicalCase) => void;
  onDeleteCase: (id: string) => void;
  onBackToHome: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  cases,
  onAddCase,
  onDeleteCase,
  onBackToHome,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('rad_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Active Admin Tab: 'ai-agent' | 'manual'
  const [activeTab, setActiveTab] = useState<'ai-agent' | 'manual'>('ai-agent');

  // --- AI AGENT STATE ---
  const [aiMode, setAiMode] = useState<'research' | 'scan_analysis' | 'batch'>('research');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiModality, setAiModality] = useState<Modality>('chest_xray');
  const [aiCategory, setAiCategory] = useState<'Normal' | 'Common Pathology' | 'Emergency Findings' | 'Post-Procedural'>('Emergency Findings');
  const [aiDifficulty, setAiDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [aiScanBase64, setAiScanBase64] = useState<string>('');
  const [aiScanMimeType, setAiScanMimeType] = useState<string>('image/jpeg');
  const [aiReferenceUrl, setAiReferenceUrl] = useState<string>('');
  const [autoUploadToDb, setAutoUploadToDb] = useState<boolean>(false);

  // AI Generation Status & Results
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiStepMessage, setAiStepMessage] = useState<string>('');
  const [aiError, setAiError] = useState<string>('');
  const [generatedCase, setGeneratedCase] = useState<MedicalCase | null>(null);
  const [batchGeneratedCases, setBatchGeneratedCases] = useState<MedicalCase[]>([]);
  const [batchTopic, setBatchTopic] = useState<string>('Emergency Radiology Critical Findings');
  const [batchCount, setBatchCount] = useState<number>(3);

  // --- MANUAL FORM STATE ---
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [modality, setModality] = useState<Modality>('chest_xray');
  const [category, setCategory] = useState<'Normal' | 'Common Pathology' | 'Emergency Findings' | 'Post-Procedural'>('Common Pathology');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [question, setQuestion] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [keyFindings, setKeyFindings] = useState('');
  const [clinicalSignificance, setClinicalSignificance] = useState('');
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState('');
  const [reportingTemplate, setReportingTemplate] = useState('');
  const [teachingPoints, setTeachingPoints] = useState('');
  const [cmeTip, setCmeTip] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  
  // Gallery photos
  const [galleryImages, setGalleryImages] = useState<{ url: string; caption: string }[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');
  
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'admin123' || passwordInput === 'rad2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('rad_admin_auth', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('rad_admin_auth');
  };

  // Upload scan file for AI Analysis
  const handleScanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAiScanMimeType(file.type || 'image/jpeg');
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAiScanBase64(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Run AI Case Agent
  const handleRunAiAgent = async () => {
    setIsGenerating(true);
    setAiError('');
    setGeneratedCase(null);
    setAiStepMessage('Connecting to Gemini Radiology Intelligence Agent...');

    try {
      if (aiMode === 'batch') {
        setAiStepMessage(`Synthesizing batch of ${batchCount} clinical cases on "${batchTopic}"...`);
        const result = await batchResearchCasesWithAI({
          topic: batchTopic,
          count: batchCount,
          modality: aiModality,
        });

        setBatchGeneratedCases(result);
        setAiStepMessage(`Synthesized ${result.length} cases!`);

        if (autoUploadToDb) {
          for (const c of result) {
            onAddCase(c);
          }
          setSuccessMessage(`Uploaded ${result.length} cases directly to live database!`);
          setTimeout(() => setSuccessMessage(''), 5000);
        }
      } else {
        setAiStepMessage(
          aiMode === 'scan_analysis'
            ? 'Analyzing radiological density and pathology markers with Multimodal Vision...'
            : `Synthesizing structured diagnostic case for "${aiPrompt || 'Clinical Radiology Topic'}"...`
        );

        const result = await researchCaseWithAI({
          prompt: aiPrompt,
          modality: aiModality,
          category: aiCategory,
          difficulty: aiDifficulty,
          imageBase64: aiScanBase64 || undefined,
          mimeType: aiScanMimeType,
          imageUrl: aiReferenceUrl || undefined,
        });

        setGeneratedCase(result);
        setAiStepMessage('Case generated successfully!');

        if (autoUploadToDb) {
          onAddCase(result);
          setSuccessMessage(`Case "${result.title}" published to live database!`);
          setTimeout(() => setSuccessMessage(''), 5000);
        }
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'AI generation encountered an issue.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Publish AI Generated Case to Database
  const handlePublishGeneratedCase = (c: MedicalCase) => {
    onAddCase(c);
    setSuccessMessage(`Published "${c.title}" to Live Case Library!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Load Generated Case into Manual Editor to refine
  const handleLoadIntoManualEditor = (c: MedicalCase) => {
    setEditingCaseId(null);
    setTitle(c.title);
    setModality(c.modality);
    setCategory(c.category);
    setImageUrl(c.imageUrl);
    setImageAlt(c.imageAlt || c.title);
    setQuestion(c.question);
    setDiagnosis(c.diagnosis);
    setKeyFindings(c.keyFindings ? c.keyFindings.join('\n') : '');
    setClinicalSignificance(c.clinicalSignificance || '');
    setDifferentialDiagnosis(c.differentialDiagnosis ? c.differentialDiagnosis.join(', ') : '');
    setReportingTemplate(c.reportingTemplate || '');
    setTeachingPoints(c.teachingPoints ? c.teachingPoints.join('\n') : '');
    setCmeTip(c.cmeTip || '');
    setDifficulty(c.difficulty);
    setGalleryImages(c.galleryImages || []);
    setActiveTab('manual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Publish all batch cases
  const handlePublishAllBatchCases = () => {
    if (batchGeneratedCases.length === 0) return;
    for (const c of batchGeneratedCases) {
      onAddCase(c);
    }
    setSuccessMessage(`Published ${batchGeneratedCases.length} cases to Live Library!`);
    setBatchGeneratedCases([]);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Manual Form Helpers
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewGalleryUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddGalleryPhoto = () => {
    if (!newGalleryUrl) {
      alert('Please provide an image URL or choose a file.');
      return;
    }
    setGalleryImages(prev => [
      ...prev,
      { url: newGalleryUrl, caption: newGalleryCaption || `Additional View ${prev.length + 1}` }
    ]);
    setNewGalleryUrl('');
    setNewGalleryCaption('');
  };

  const handleRemoveGalleryPhoto = (index: number) => {
    setGalleryImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleStartEdit = (c: MedicalCase) => {
    setEditingCaseId(c.id);
    setTitle(c.title);
    setModality(c.modality);
    setCategory(c.category);
    setImageUrl(c.imageUrl);
    setImageAlt(c.imageAlt || c.title);
    setQuestion(c.question);
    setDiagnosis(c.diagnosis);
    setKeyFindings(c.keyFindings ? c.keyFindings.join('\n') : '');
    setClinicalSignificance(c.clinicalSignificance || '');
    setDifferentialDiagnosis(c.differentialDiagnosis ? c.differentialDiagnosis.join(', ') : '');
    setReportingTemplate(c.reportingTemplate || '');
    setTeachingPoints(c.teachingPoints ? c.teachingPoints.join('\n') : '');
    setCmeTip(c.cmeTip || '');
    setDifficulty(c.difficulty);
    setGalleryImages(c.galleryImages || []);
    setActiveTab('manual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingCaseId(null);
    setTitle('');
    setImageUrl('');
    setImageAlt('');
    setQuestion('');
    setDiagnosis('');
    setKeyFindings('');
    setClinicalSignificance('');
    setDifferentialDiagnosis('');
    setReportingTemplate('');
    setTeachingPoints('');
    setCmeTip('');
    setGalleryImages([]);
    setNewGalleryUrl('');
    setNewGalleryCaption('');
  };

  const handleSubmitCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !diagnosis || !imageUrl) {
      alert('Please fill in at least Title, Diagnosis, and Primary Image.');
      return;
    }

    const caseId = editingCaseId || `custom-${Date.now()}`;

    const updatedCase: MedicalCase = {
      id: caseId,
      title,
      modality,
      category,
      imageUrl,
      imageAlt: imageAlt || title,
      question: question || 'What are the primary imaging findings?',
      diagnosis,
      keyFindings: keyFindings ? keyFindings.split('\n').filter(Boolean) : ['Findings consistent with clinical presentation.'],
      clinicalSignificance: clinicalSignificance || 'Important teaching case for clinical practice.',
      differentialDiagnosis: differentialDiagnosis ? differentialDiagnosis.split(',').map(s => s.trim()) : ['Normal variant'],
      reportingTemplate: reportingTemplate || 'CHEST/HEAD, RADIOGRAPH/CT:\nNormal study.',
      teachingPoints: teachingPoints ? teachingPoints.split('\n').filter(Boolean) : ['Correlate clinically with physical examination.'],
      cmeTip: cmeTip || 'Always verify films with clinical history.',
      difficulty,
      galleryImages: galleryImages.length > 0 ? galleryImages : undefined,
    };

    onAddCase(updatedCase);
    setSuccessMessage(
      editingCaseId 
        ? `Successfully updated case: "${title}"!` 
        : `Successfully added case: "${title}"!`
    );
    
    handleCancelEdit();
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Quick topic chips
  const QUICK_TOPICS = [
    { label: 'Tension Pneumothorax', mod: 'chest_xray' as Modality, cat: 'Emergency Findings' },
    { label: 'Epidural Hematoma (Lens Sign)', mod: 'head_ct' as Modality, cat: 'Emergency Findings' },
    { label: 'Subarachnoid Hemorrhage (Star of David)', mod: 'head_ct' as Modality, cat: 'Emergency Findings' },
    { label: 'Lobar Pneumonia (Air Bronchogram)', mod: 'chest_xray' as Modality, cat: 'Common Pathology' },
    { label: 'Mount Fuji Sign (Pneumocephalus)', mod: 'head_ct' as Modality, cat: 'Emergency Findings' },
    { label: 'Pneumoperitoneum (Rigler Sign)', mod: 'chest_xray' as Modality, cat: 'Emergency Findings' },
    { label: 'Middle Cerebral Artery Infarct', mod: 'head_ct' as Modality, cat: 'Emergency Findings' },
    { label: 'Flail Chest & Rib Fractures', mod: 'chest_xray' as Modality, cat: 'Emergency Findings' },
  ];

  // If not authenticated, show login
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/80 rounded-2xl mx-auto flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Portal Login</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter admin password to research, generate, upload, and manage radiology cases.
            </p>
            <div className="mt-2 text-xs bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-lg text-slate-600 dark:text-slate-300 inline-block font-mono">
              Demo Password: <span className="font-bold text-blue-600 dark:text-blue-400">admin123</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter admin123"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs bg-rose-50 dark:bg-rose-950/50 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Incorrect password. Please try "admin123".</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg transition-all text-sm flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" /> Sign In to Admin Panel
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onBackToHome}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Website Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Radiology Case Management</h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                AI Agent Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Research, analyze medical scans with Vision, and upload structured CME cases.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to App
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Main Mode Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('ai-agent')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ai-agent'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Autonomous AI Case Agent
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'manual'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Edit3 className="w-4 h-4" /> Manual Case Builder {editingCaseId && `(Editing)`}
        </button>
      </div>

      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Active Tab Workspace */}
        <div className="lg:col-span-2 space-y-6">

          {/* --- TAB 1: AI CASE AGENT STUDIO --- */}
          {activeTab === 'ai-agent' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
              
              {/* Agent Sub-Mode Selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" /> AI Case Research & Synthesis Studio
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Powered by Multimodal Radiology AI
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    onClick={() => setAiMode('research')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      aiMode === 'research' 
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Clinical Topic Research
                  </button>
                  <button
                    onClick={() => setAiMode('scan_analysis')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      aiMode === 'scan_analysis' 
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Scan Analysis
                  </button>
                  <button
                    onClick={() => setAiMode('batch')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      aiMode === 'batch' 
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Batch Pack (3+)
                  </button>
                </div>
              </div>

              {/* Mode A: Clinical Topic Research */}
              {aiMode === 'research' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Target Pathology / Clinical Topic to Research
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g., Tension Pneumocephalus with Mount Fuji Sign, or Hamman's Sign Pneumomediastinum..."
                        className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 pr-10"
                      />
                      <Sparkles className="w-5 h-5 text-indigo-400 absolute right-3.5 top-3.5" />
                    </div>
                  </div>

                  {/* Quick Preset Chips */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quick Suggestions:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {QUICK_TOPICS.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setAiPrompt(item.label);
                            setAiModality(item.mod);
                            setAiCategory(item.cat as any);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Imaging Modality
                      </label>
                      <select
                        value={aiModality}
                        onChange={(e) => setAiModality(e.target.value as Modality)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="chest_xray">Chest X-ray (PA/Lateral)</option>
                        <option value="head_ct">Head CT (Non-contrast)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Classification
                      </label>
                      <select
                        value={aiCategory}
                        onChange={(e) => setAiCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="Emergency Findings">Emergency Findings</option>
                        <option value="Common Pathology">Common Pathology</option>
                        <option value="Normal">Normal</option>
                        <option value="Post-Procedural">Post-Procedural</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Difficulty
                      </label>
                      <select
                        value={aiDifficulty}
                        onChange={(e) => setAiDifficulty(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Optional Direct Reference Image URL (Or let agent assign high-res open-access scan)
                    </label>
                    <input
                      type="text"
                      value={aiReferenceUrl}
                      onChange={(e) => setAiReferenceUrl(e.target.value)}
                      placeholder="https://... (Optional)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Mode B: Multimodal Scan Analysis */}
              {aiMode === 'scan_analysis' && (
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 text-center space-y-3">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950 rounded-2xl mx-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Scan className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Upload Medical Imaging Scan for AI Diagnostic Extraction
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                        Drop an unannotated Chest X-ray or Head CT slice. AI Vision will analyze anatomical density, spot anomalies, and compile a CME case.
                      </p>
                    </div>

                    <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all">
                      <Upload className="w-4 h-4" />
                      <span>Choose Imaging Scan File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScanUpload}
                        className="hidden"
                      />
                    </label>

                    {aiScanBase64 && (
                      <div className="pt-3 flex items-center justify-center gap-4">
                        <div className="w-24 h-24 rounded-xl overflow-hidden border border-indigo-300 dark:border-indigo-700 bg-black">
                          <img src={aiScanBase64} alt="Uploaded Scan" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-left text-xs">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Scan Attached & Encoded
                          </span>
                          <p className="text-slate-500 mt-0.5">Ready for multimodal neural analysis.</p>
                          <button
                            onClick={() => setAiScanBase64('')}
                            className="text-rose-500 hover:underline text-[11px] mt-1"
                          >
                            Remove scan
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Clinical Vignette / Guidance for AI (Optional)
                    </label>
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g., 45yo trauma patient after high-speed MVC, evaluate for parenchymal hemorrhage..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Modality
                      </label>
                      <select
                        value={aiModality}
                        onChange={(e) => setAiModality(e.target.value as Modality)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="chest_xray">Chest X-ray (PA/Lateral)</option>
                        <option value="head_ct">Head CT (Non-contrast)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Expected Category
                      </label>
                      <select
                        value={aiCategory}
                        onChange={(e) => setAiCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="Emergency Findings">Emergency Findings</option>
                        <option value="Common Pathology">Common Pathology</option>
                        <option value="Normal">Normal</option>
                        <option value="Post-Procedural">Post-Procedural</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode C: Batch Generation */}
              {aiMode === 'batch' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4" /> Batch Autonomous Remote Ingestion
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Generate multi-case continuous medical education curriculum packs with standardized reporting criteria in one request.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Batch Curriculum Theme / Specialty Topic
                    </label>
                    <input
                      type="text"
                      value={batchTopic}
                      onChange={(e) => setBatchTopic(e.target.value)}
                      placeholder="e.g., Emergency Head CT Acute Stroke & Hemorrhage, or Critical ICU Radiographs..."
                      className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Number of Cases
                      </label>
                      <select
                        value={batchCount}
                        onChange={(e) => setBatchCount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      >
                        <option value={2}>2 Cases (Fast)</option>
                        <option value={3}>3 Cases (Recommended)</option>
                        <option value={5}>5 Cases (Full CME Module)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Modality Filter
                      </label>
                      <select
                        value={aiModality}
                        onChange={(e) => setAiModality(e.target.value as Modality)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="chest_xray">Chest X-ray</option>
                        <option value="head_ct">Head CT</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Direct Ingestion Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="autoUploadToggle"
                  checked={autoUploadToDb}
                  onChange={(e) => setAutoUploadToDb(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <label htmlFor="autoUploadToggle" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Direct Remote Upload: Auto-save generated cases directly to live database upon completion
                </label>
              </div>

              {/* Error Box */}
              {aiError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Notice: </span>
                    <span>{aiError}</span>
                  </div>
                </div>
              )}

              {/* Run Button */}
              <button
                type="button"
                disabled={isGenerating || (aiMode === 'scan_analysis' && !aiScanBase64)}
                onClick={handleRunAiAgent}
                className={`w-full py-4 rounded-2xl font-bold text-sm text-white shadow-xl transition-all flex items-center justify-center gap-2 ${
                  isGenerating 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-indigo-500/20 active:scale-[0.99]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AI Agent Synthesizing Case...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>
                      {aiMode === 'batch' 
                        ? `Research & Ingest ${batchCount} Cases with AI` 
                        : aiMode === 'scan_analysis'
                        ? 'Diagnose Scan & Generate Case with AI Vision'
                        : 'Research & Synthesize Radiology Case with AI'}
                    </span>
                  </>
                )}
              </button>

              {/* Generation Progress Indicator */}
              {isGenerating && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-pulse flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {aiStepMessage}
                  </span>
                </div>
              )}

              {/* --- SINGLE GENERATED CASE PREVIEW --- */}
              {generatedCase && (
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        AI Researched Case Preview
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoadIntoManualEditor(generatedCase)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Refine in Editor
                      </button>
                      <button
                        onClick={() => handlePublishGeneratedCase(generatedCase)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload to Live Library
                      </button>
                    </div>
                  </div>

                  {/* Case Summary Card */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <div className="w-32 h-32 rounded-xl bg-black overflow-hidden flex-shrink-0 border border-slate-300 dark:border-slate-600">
                        <img src={generatedCase.imageUrl} alt={generatedCase.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded ${
                            generatedCase.modality === 'chest_xray' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}>
                            {generatedCase.modality === 'chest_xray' ? 'Chest X-ray' : 'Head CT'}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            {generatedCase.category}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            Level: {generatedCase.difficulty}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                          {generatedCase.title}
                        </h4>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          Diagnosis: {generatedCase.diagnosis}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-semibold">Question:</span> {generatedCase.question}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700/80">
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                          Key Radiographic Findings
                        </h5>
                        <ul className="space-y-1">
                          {generatedCase.keyFindings.map((f, i) => (
                            <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                          CME Pearl & Reporting
                        </h5>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-line">
                          {generatedCase.reportingTemplate}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 font-medium">
                          💡 Tip: {generatedCase.cmeTip}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- BATCH CASES PREVIEW --- */}
              {batchGeneratedCases.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-emerald-500" /> Batch Cases Generated ({batchGeneratedCases.length})
                      </h3>
                      <p className="text-xs text-slate-500">Ready for instant batch database ingestion.</p>
                    </div>
                    <button
                      onClick={handlePublishAllBatchCases}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg transition-all flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Publish All {batchGeneratedCases.length} Cases
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {batchGeneratedCases.map((c, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-black overflow-hidden flex-shrink-0">
                            <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              {c.modality === 'chest_xray' ? 'CXR' : 'CT'} • {c.category}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{c.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.diagnosis}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleLoadIntoManualEditor(c)}
                            className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePublishGeneratedCase(c)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                          >
                            Publish
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- TAB 2: MANUAL CASE BUILDER FORM --- */}
          {activeTab === 'manual' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    editingCaseId 
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400' 
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                  }`}>
                    {editingCaseId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {editingCaseId ? 'Edit Radiology Case' : 'Manual Radiology Case Builder'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {editingCaseId ? `Editing ID: ${editingCaseId}` : 'Fill in clinical and radiological parameters manually'}
                    </p>
                  </div>
                </div>

                {editingCaseId && (
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmitCase} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Case Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Pneumoperitoneum under Diaphragm"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Diagnosis *
                    </label>
                    <input
                      type="text"
                      required
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g., Perforated Peptic Ulcer"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Modality
                    </label>
                    <select
                      value={modality}
                      onChange={(e) => setModality(e.target.value as Modality)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="chest_xray">Chest X-ray (PA/Lateral)</option>
                      <option value="head_ct">Head CT (Non-contrast)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Common Pathology">Common Pathology</option>
                      <option value="Emergency Findings">Emergency Findings</option>
                      <option value="Post-Procedural">Post-Procedural</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Image configuration */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Primary Radiological Image *
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                        Image Web URL (HTTPS)
                      </label>
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://... or upload below"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                        Or Upload Image from Computer
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-950 dark:file:text-blue-300 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>

                  {imageUrl && (
                    <div className="flex items-center gap-4 pt-2">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-black border border-slate-300 dark:border-slate-600">
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-xs text-slate-500">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Image Loaded</span>
                        <p className="truncate max-w-xs mt-0.5">{imageUrl.slice(0, 50)}...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional gallery views */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Additional Multi-View Images (Coronal/Sagittal/Lateral)
                    </h3>
                    <span className="text-xs text-slate-500">{galleryImages.length} attached</span>
                  </div>

                  {galleryImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {galleryImages.map((img, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 aspect-square bg-black">
                          <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between text-[11px] text-white">
                            <span className="truncate">{img.caption}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryPhoto(idx)}
                              className="text-rose-400 hover:text-rose-300 font-bold self-end"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                    <input
                      type="text"
                      value={newGalleryUrl}
                      onChange={(e) => setNewGalleryUrl(e.target.value)}
                      placeholder="Image URL or upload"
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={newGalleryCaption}
                      onChange={(e) => setNewGalleryCaption(e.target.value)}
                      placeholder="View Caption (e.g. Bone Window)"
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleGalleryFileUpload}
                        className="hidden"
                        id="galleryFileInput"
                      />
                      <label
                        htmlFor="galleryFileInput"
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer hover:bg-slate-300 flex items-center justify-center"
                      >
                        File
                      </label>
                      <button
                        type="button"
                        onClick={handleAddGalleryPhoto}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                      >
                        + Add View
                      </button>
                    </div>
                  </div>
                </div>

                {/* Clinical Content fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Clinical Vignette / Question
                    </label>
                    <textarea
                      rows={2}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="What is the primary radiological finding and immediate next step in management?"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Key Radiographic Findings (One finding per line)
                    </label>
                    <textarea
                      rows={3}
                      value={keyFindings}
                      onChange={(e) => setKeyFindings(e.target.value)}
                      placeholder="• Loss of gray-white differentiation&#10;• Midline shift of 4mm&#10;• Dense MCA sign"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Clinical Significance & Emergency Implications
                    </label>
                    <input
                      type="text"
                      value={clinicalSignificance}
                      onChange={(e) => setClinicalSignificance(e.target.value)}
                      placeholder="e.g. Critical finding indicating acute arterial occlusion requiring immediate thrombolysis evaluation."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Differential Diagnoses (Comma separated)
                      </label>
                      <input
                        type="text"
                        value={differentialDiagnosis}
                        onChange={(e) => setDifferentialDiagnosis(e.target.value)}
                        placeholder="Subdural hematoma, Epidural hematoma, Hemorrhagic contusion"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Teaching Pearls / High-Yield Points (One per line)
                      </label>
                      <textarea
                        rows={2}
                        value={teachingPoints}
                        onChange={(e) => setTeachingPoints(e.target.value)}
                        placeholder="Always inspect symmetrical structures&#10;Check bone windows for occult linear fractures"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Structured Radiology Report Excerpt
                    </label>
                    <textarea
                      rows={2}
                      value={reportingTemplate}
                      onChange={(e) => setReportingTemplate(e.target.value)}
                      placeholder="CHEST, PA AND LATERAL: Findings compatible with..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      CME Board / Shift Tip
                    </label>
                    <input
                      type="text"
                      value={cmeTip}
                      onChange={(e) => setCmeTip(e.target.value)}
                      placeholder="If patient cannot stand, obtain left lateral decubitus view"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-3.5 rounded-xl font-semibold shadow-lg transition-all text-sm flex items-center justify-center gap-2 text-white ${
                    editingCaseId 
                      ? 'bg-amber-600 hover:bg-amber-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {editingCaseId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {editingCaseId ? 'Update Case in Database' : 'Publish New Teaching Case to Library'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Live Library Inventory */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col h-[850px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Live Case Inventory</h3>
              <p className="text-[11px] text-slate-500">Live database storage</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full">
              {cases.length} Total
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {cases.length === 0 ? (
              <div className="text-center py-12 px-4">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No cases in database yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">Use the AI Agent on the left to research and ingest cases!</p>
              </div>
            ) : (
              cases.map((c) => (
                <div 
                  key={c.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                    editingCaseId === c.id 
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700' 
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-black flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={c.imageUrl} alt={c.imageAlt} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        c.modality === 'chest_xray' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}>
                        {c.modality === 'chest_xray' ? 'CXR' : 'CT'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{c.category}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      {c.diagnosis || c.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(c)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                      title="Edit Case"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${c.diagnosis || c.title}"?`)) {
                          onDeleteCase(c.id);
                          if (editingCaseId === c.id) handleCancelEdit();
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Delete Case"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
