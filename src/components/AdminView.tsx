import React, { useState } from 'react';
import { MedicalCase, Modality } from '../types';
import { 
  Lock, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  FileText, 
  Brain, 
  Check, 
  AlertCircle, 
  LogOut, 
  ArrowLeft,
  Image as ImageIcon,
  Edit3,
  Upload,
  X,
  Save,
  Images
} from 'lucide-react';

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

  // Edit / Add state
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

  // Form state
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
  
  // Gallery photos (additional views without replacing original primary image)
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
      alert('Please provide an image URL or choose a file for the additional gallery photo.');
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

  // If not authenticated, show secure login prompt
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
              Enter admin password to upload, edit, and manage radiology teaching cases.
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Case Management Portal</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload new cases, edit existing records, and manage library inventory. ({cases.length} total cases)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to App
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-sm font-semibold hover:bg-rose-100 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 animate-fade-in">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form (Add or Edit) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800">
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
                  {editingCaseId ? 'Edit Radiology Case' : 'Upload New Radiology Case'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {editingCaseId ? `Editing ID: ${editingCaseId}` : 'Fill in clinical and radiological parameters'}
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

            {/* Image Source Section (URL or File Upload) */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Image Source (Direct URL or Upload File) *
                  </label>
                  <input
                    type="text"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://upload.wikimedia.org/... or uploaded image data"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Upload Image File
                  </label>
                  <label className="cursor-pointer px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm">
                    <Upload className="w-4 h-4" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {imageUrl && (
                <div className="flex items-center gap-4 pt-2">
                  <div className="w-20 h-20 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600 flex-shrink-0">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Primary Image Loaded:</span> Main view for case preview.
                  </div>
                </div>
              )}
            </div>

            {/* Condition Gallery Photos (Additional Views without replacing original primary image) */}
            <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Images className="w-4 h-4 text-indigo-600" /> Condition Image Gallery Photos ({galleryImages.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Add extra radiological angles, projections, or cuts for this condition without replacing the primary image above.
                  </p>
                </div>
              </div>

              {/* Added Gallery Photos List */}
              {galleryImages.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {galleryImages.map((img, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0">
                        <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{img.caption}</p>
                        <span className="text-[10px] text-slate-400 font-mono">View #{idx + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryPhoto(idx)}
                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 hover:bg-rose-100 transition-colors"
                        title="Remove gallery photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Gallery Photo Input Box */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Add Gallery Photo (URL or File Upload)</div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      value={newGalleryUrl}
                      onChange={(e) => setNewGalleryUrl(e.target.value)}
                      placeholder="Image URL or uploaded file data"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={newGalleryCaption}
                      onChange={(e) => setNewGalleryCaption(e.target.value)}
                      placeholder="Caption (e.g., Lateral View)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors flex-1" title="Upload file">
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleGalleryFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleAddGalleryPhoto}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 shadow-sm transition-colors flex-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>

                {newGalleryUrl && (
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                      <img src={newGalleryUrl} alt="New Preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Gallery photo staged. Click "Add" above to include it!</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Image Alt Description
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="e.g., Upright chest radiograph showing free air"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Clinical Question
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., What radiographic sign indicates free air under the diaphragm?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Key Findings (One per line)
                </label>
                <textarea
                  rows={3}
                  value={keyFindings}
                  onChange={(e) => setKeyFindings(e.target.value)}
                  placeholder="Crescentic lucency beneath right hemidiaphragm&#10;Rigler's sign on supine view"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Teaching Points (One per line)
                </label>
                <textarea
                  rows={3}
                  value={teachingPoints}
                  onChange={(e) => setTeachingPoints(e.target.value)}
                  placeholder="Upright chest X-ray is most sensitive for pneumoperitoneum&#10;Requires emergent surgical consultation"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Clinical Significance
                </label>
                <input
                  type="text"
                  value={clinicalSignificance}
                  onChange={(e) => setClinicalSignificance(e.target.value)}
                  placeholder="Surgical emergency indicating hollow viscus perforation"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Differential Diagnosis (Comma separated)
                </label>
                <input
                  type="text"
                  value={differentialDiagnosis}
                  onChange={(e) => setDifferentialDiagnosis(e.target.value)}
                  placeholder="Chilaiditi syndrome, Subphrenic abscess"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reporting Template
                </label>
                <textarea
                  rows={2}
                  value={reportingTemplate}
                  onChange={(e) => setReportingTemplate(e.target.value)}
                  placeholder="CHEST, UPRIGHT: Free intraperitoneal air visualized..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  CME Expert Pearl Tip
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
              {editingCaseId ? 'Update Case in Firebase' : 'Publish New Teaching Case to Library'}
            </button>
          </form>
        </div>

        {/* Right Column: Existing Cases Manager */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col h-[800px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Case Library Inventory</h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full">
              {cases.length} Total
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {cases.map((c) => (
              <div 
                key={c.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                  editingCaseId === c.id 
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700' 
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                  <img src={c.imageUrl} alt={c.imageAlt} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      c.modality === 'chest_xray' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}>
                      {c.modality === 'chest_xray' ? 'CXR' : 'CT'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{c.category}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {c.diagnosis}
                  </h4>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(c)}
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                    title="Edit Case"
                    aria-label="Edit case"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${c.diagnosis}"?`)) {
                        onDeleteCase(c.id);
                        if (editingCaseId === c.id) handleCancelEdit();
                      }
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title="Delete Case"
                    aria-label="Delete case"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
