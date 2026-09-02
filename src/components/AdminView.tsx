import React, { useState, useEffect } from 'react';
import { MedicalCase, Modality, PaymentConfig, PaymentProvider } from '../types';
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
  FileCheck,
  Cpu,
  Copy,
  Check,
  ExternalLink,
  Code,
  Terminal,
  Send,
  Zap,
  RefreshCw,
  Globe,
  Key,
  FileJson,
  Eye,
  EyeOff,
  Smartphone,
  CreditCard,
  Sliders,
  Wallet,
  Stethoscope,
  Activity,
  Wifi,
  Users
} from 'lucide-react';
import { researchCaseWithAI, batchResearchCasesWithAI } from '../services/aiAgentService';
import { fetchPaymentConfig, testPalPlussApi, updatePaymentConfig } from '../services/paymentService';
import { verifyAdminPassword, updateAdminPassword } from '../services/adminAuthService';
import { DiagnosticPanel } from './DiagnosticPanel';
import { DatabaseTerminal } from './DatabaseTerminal';
import { UserManagementView } from './UserManagementView';
import { getSafeImageUrl, handleImageError, compressAndReadImageFile } from '../lib/imageUtils';
import { FormattedText } from './FormattedText';
import { FormattedTextarea } from './FormattingToolbar';

interface AdminViewProps {
  cases: MedicalCase[];
  onAddCase: (newCase: MedicalCase) => void;
  onDeleteCase: (id: string) => void;
  onBackToHome: () => void;
  onRefreshCases?: () => Promise<void>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  cases,
  onAddCase,
  onDeleteCase,
  onBackToHome,
  onRefreshCases,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('rad_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState(false);

  // Active Admin Tab: 'ai-agent' | 'manual' | 'automation' | 'users' | 'payment' | 'security' | 'diagnostics' | 'terminal'
  const [activeTab, setActiveTab] = useState<'ai-agent' | 'manual' | 'automation' | 'users' | 'payment' | 'security' | 'diagnostics' | 'terminal'>('ai-agent');

  // --- ADMIN PASSWORD CHANGE STATE ---
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  // --- PAYMENT / PALPLUSS GATEWAY CONFIG STATE ---
  const [paymentConfigState, setPaymentConfigState] = useState<PaymentConfig>({
    freeCasesLimit: 5,
    premiumPriceKes: 1000,
    activeProvider: 'palpluss',
    palplussApiKey: '',
    palplussChannelId: '',
    darajaEnvironment: 'sandbox',
    darajaBusinessShortcode: '1661655',
    paybillOrTillNumber: '1661655',
    accountReference: 'RadMed Pro',
  });
  const [palplussApiKeyInput, setPalplussApiKeyInput] = useState<string>('');
  const [palplussChannelInput, setPalplussChannelInput] = useState<string>('');
  const [priceKesInput, setPriceKesInput] = useState<number>(1000);
  const [freeLimitInput, setFreeLimitInput] = useState<number>(5);
  const [providerInput, setProviderInput] = useState<PaymentProvider>('palpluss');
  const [isSavingPayment, setIsSavingPayment] = useState<boolean>(false);
  const [isTestingPalpluss, setIsTestingPalpluss] = useState<boolean>(false);
  const [palplussTestResult, setPalplussTestResult] = useState<any | null>(null);
  const [paymentNoticeMsg, setPaymentNoticeMsg] = useState<string>('');

  useEffect(() => {
    fetchPaymentConfig().then((cfg) => {
      if (cfg) {
        setPaymentConfigState(cfg);
        setPriceKesInput(cfg.premiumPriceKes || 1000);
        setFreeLimitInput(cfg.freeCasesLimit || 5);
        setProviderInput(cfg.activeProvider || 'palpluss');
        if (cfg.palplussChannelId) setPalplussChannelInput(cfg.palplussChannelId);
      }
    });
  }, []);

  // --- AUTOMATION / N8N STATE ---
  const [apiSecretKey] = useState<string>('radmed_admin_secret_key_2026');
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [testEndpoint, setTestEndpoint] = useState<'curate' | 'single' | 'batch'>('curate');
  const [isTestingApi, setIsTestingApi] = useState<boolean>(false);
  const [apiTestResponse, setApiTestResponse] = useState<any | null>(null);
  const [apiTestStatus, setApiTestStatus] = useState<string | null>(null);

  const [curatePrompt, setCuratePrompt] = useState<string>('Acute Subdural Hematoma with Midline Shift');
  const [curateModality, setCurateModality] = useState<Modality>('head_ct');
  const [curateCategory, setCurateCategory] = useState<string>('Emergency Findings');

  const [manualPayloadJson, setManualPayloadJson] = useState<string>(
    JSON.stringify(
      {
        title: "Tension Pneumothorax with Mediastinal Shift",
        modality: "chest_xray",
        category: "Emergency Findings",
        difficulty: "Intermediate",
        question: "A 28-year-old trauma patient presents with acute pleuritic chest pain and hemodynamic compromise. What is the immediate diagnosis?",
        diagnosis: "Right Tension Pneumothorax",
        keyFindings: [
          "Large right-sided visceral pleural line with absent peripheral lung markings.",
          "Contralateral mediastinal shift toward the left.",
          "Depression of the right hemidiaphragm."
        ],
        clinicalSignificance: "Life-threatening surgical emergency requiring immediate needle decompression.",
        differentialDiagnosis: [
          "Right Tension Pneumothorax",
          "Simple Spontaneous Pneumothorax",
          "Bullous Emphysema"
        ],
        reportingTemplate: "CHEST AP PORTABLE:\nFINDINGS: Marked right tension pneumothorax with contralateral mediastinal deviation.\nIMPRESSION: Right tension pneumothorax.",
        teachingPoints: [
          "Tension pneumothorax is a clinical emergency; decompression should not be delayed for imaging in unstable patients.",
          "Check for deep sulcus sign on supine trauma radiographs."
        ],
        cmeTip: "High Yield: Visceral pleural line displacement with mediastinal shift distinguishes tension from simple pneumothorax."
      },
      null,
      2
    )
  );

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
  
  // Case Scenario & Clinical Example
  const [caseScenario, setCaseScenario] = useState('');
  const [caseScenarioImageUrl, setCaseScenarioImageUrl] = useState('');
  const [caseScenarioImageCaption, setCaseScenarioImageCaption] = useState('');
  const [caseExample, setCaseExample] = useState('');

  // Gallery photos
  const [galleryImages, setGalleryImages] = useState<{ url: string; caption: string }[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');
  
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setLoginError(true);
      return;
    }
    setIsLoggingIn(true);
    setLoginError(false);
    try {
      const isValid = await verifyAdminPassword(passwordInput);
      if (isValid) {
        setIsAuthenticated(true);
        sessionStorage.setItem('rad_admin_auth', 'true');
        setPasswordInput('');
        setLoginError(false);
      } else {
        setLoginError(true);
      }
    } catch {
      setLoginError(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('rad_admin_auth');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (!currentPasswordInput.trim()) {
      setChangePasswordError('Please enter your current admin password.');
      return;
    }

    if (!newPasswordInput.trim()) {
      setChangePasswordError('Please enter a new password.');
      return;
    }

    if (newPasswordInput.length < 6) {
      setChangePasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setChangePasswordError('New passwords do not match. Please re-enter.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await updateAdminPassword(currentPasswordInput, newPasswordInput);
      if (res.success) {
        setChangePasswordSuccess(res.message || 'Admin password updated successfully!');
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        setTimeout(() => {
          setChangePasswordSuccess('');
          setIsChangePasswordOpen(false);
        }, 3000);
      } else {
        setChangePasswordError(res.error || 'Failed to update admin password.');
      }
    } catch (err: any) {
      setChangePasswordError(err?.message || 'Error occurred while updating admin password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Upload scan file for AI Analysis
  const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAiScanMimeType(file.type || 'image/jpeg');
      try {
        const compressedBase64 = await compressAndReadImageFile(file, 1280, 0.80);
        setAiScanBase64(compressedBase64);
      } catch (err) {
        console.error('Failed to compress scan image:', err);
      }
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
    setCaseScenario(c.caseScenario || '');
    setCaseScenarioImageUrl(c.caseScenarioImageUrl || c.imageUrl);
    setCaseScenarioImageCaption(c.caseScenarioImageCaption || '');
    setCaseExample(c.caseExample || '');
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
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressAndReadImageFile(file, 1280, 0.80);
        setImageUrl(compressedBase64);
      } catch (err) {
        console.error('Failed to read image file:', err);
      }
    }
  };

  const handleScenarioImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressAndReadImageFile(file, 1024, 0.78);
        setCaseScenarioImageUrl(compressedBase64);
      } catch (err) {
        console.error('Failed to read scenario image file:', err);
      }
    }
  };

  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressAndReadImageFile(file, 1024, 0.78);
        setNewGalleryUrl(compressedBase64);
      } catch (err) {
        console.error('Failed to read gallery image file:', err);
      }
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
    setCaseScenario(c.caseScenario || '');
    setCaseScenarioImageUrl(c.caseScenarioImageUrl || c.imageUrl);
    setCaseScenarioImageCaption(c.caseScenarioImageCaption || '');
    setCaseExample(c.caseExample || '');
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
    setCaseScenario('');
    setCaseScenarioImageUrl('');
    setCaseScenarioImageCaption('');
    setCaseExample('');
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
      caseScenario: caseScenario.trim() || undefined,
      caseScenarioImageUrl: caseScenarioImageUrl.trim() || imageUrl,
      caseScenarioImageCaption: caseScenarioImageCaption.trim() || undefined,
      caseExample: caseExample.trim() || undefined,
      galleryImages: galleryImages.length > 0 ? galleryImages : undefined,
      updatedAt: Date.now(),
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

  // Automation / n8n helpers
  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTestApiCall = async () => {
    setIsTestingApi(true);
    setApiTestResponse(null);
    setApiTestStatus(null);

    try {
      let endpointUrl = '/api/admin/cases';
      let payload: any = {};

      if (testEndpoint === 'curate') {
        endpointUrl = '/api/admin/cases/curate-and-publish';
        payload = {
          prompt: curatePrompt,
          modality: curateModality,
          category: curateCategory,
          difficulty: 'Intermediate',
        };
      } else if (testEndpoint === 'single') {
        endpointUrl = '/api/admin/cases';
        payload = JSON.parse(manualPayloadJson);
      } else {
        endpointUrl = '/api/admin/cases/batch';
        payload = {
          cases: [JSON.parse(manualPayloadJson)],
        };
      }

      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiSecretKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setApiTestResponse(data);
      setApiTestStatus(res.ok ? '200 OK - Persisted in Database' : `${res.status} Error`);

      if (data.success && (data.case || data.cases)) {
        if (data.case) {
          onAddCase(data.case);
        } else if (Array.isArray(data.cases)) {
          data.cases.forEach((c: MedicalCase) => onAddCase(c));
        }
        setSuccessMessage(`API test successful! Case written directly to Firestore.`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err: any) {
      setApiTestResponse({ error: err.message || 'Network error occurred' });
      setApiTestStatus('500 Client Error');
    } finally {
      setIsTestingApi(false);
    }
  };

  const getN8nTemplateJson = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://radmed.app';
    return JSON.stringify(
      {
        name: "RadMed Autonomous Radiology Case Publisher",
        nodes: [
          {
            parameters: {
              rule: {
                interval: [{ field: "hours", hoursInterval: 6 }]
              }
            },
            name: "Schedule Trigger (Every 6h)",
            type: "n8n-nodes-base.scheduleTrigger",
            typeVersion: 1.1,
            position: [250, 300]
          },
          {
            parameters: {
              model: "gemini-3.7-flash",
              prompt: "Select a high-yield clinical emergency radiology topic, such as Tension Pneumothorax, Epidural Hematoma, or Aortic Dissection."
            },
            name: "AI Clinical Topic Selector",
            type: "n8n-nodes-base.openAi",
            typeVersion: 1,
            position: [480, 300]
          },
          {
            parameters: {
              method: "POST",
              url: `${origin}/api/admin/cases/curate-and-publish`,
              authentication: "genericCredentialType",
              genericAuthType: "httpHeaderAuth",
              sendHeaders: true,
              headerParameters: {
                parameters: [
                  {
                    name: "Authorization",
                    value: `Bearer ${apiSecretKey}`
                  },
                  {
                    name: "Content-Type",
                    value: "application/json"
                  }
                ]
              },
              sendBody: true,
              specifyBody: "json",
              jsonBody: `{\n  "prompt": "={{ $json.topic || 'Acute Tension Pneumothorax' }}",\n  "modality": "chest_xray",\n  "category": "Emergency Findings",\n  "difficulty": "Intermediate"\n}`
            },
            name: "RadMed Autopilot Case Publisher",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.1,
            position: [720, 300]
          }
        ],
        connections: {
          "Schedule Trigger (Every 6h)": {
            main: [
              [
                {
                  node: "AI Clinical Topic Selector",
                  type: "main",
                  index: 0
                }
              ]
            ]
          },
          "AI Clinical Topic Selector": {
            main: [
              [
                {
                  node: "RadMed Autopilot Case Publisher",
                  type: "main",
                  index: 0
                }
              ]
            ]
          }
        }
      },
      null,
      2
    );
  };

  // If not authenticated, show login
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/80 rounded-2xl mx-auto flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Terminal Login</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter admin password to research, generate, upload, and manage radiology cases.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Administrator Password
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs bg-rose-50 dark:bg-rose-950/50 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Incorrect password. Please verify your credentials and try again.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" /> Sign In to Admin Panel
                </>
              )}
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

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setIsChangePasswordOpen(true);
              setChangePasswordError('');
              setChangePasswordSuccess('');
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors flex items-center gap-2 cursor-pointer border border-amber-200 dark:border-amber-800/80 shadow-sm"
            title="Change Admin Password"
          >
            <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Change Password
          </button>
          <button
            onClick={onBackToHome}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to App
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center gap-2 cursor-pointer"
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
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('ai-agent')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ai-agent'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Autonomous AI Case Agent
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'manual'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Edit3 className="w-4 h-4" /> Manual Case Builder {editingCaseId && `(Editing)`}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Users & Testers
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'automation'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" /> API & n8n Automation
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'payment'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4" /> PalPluss M-Pesa Gateway
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'security'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" /> Security & Password
        </button>
        <button
          onClick={() => setActiveTab('terminal')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'terminal'
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" /> Database Terminal & CLI
        </button>
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'diagnostics'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" /> System & Sync Diagnostics
        </button>
      </div>

      {/* Main Workspace */}
      {activeTab === 'users' ? (
        <UserManagementView currentAdminEmail="admin@radmed.org" />
      ) : (
        /* 2-Column Main Workspace */
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
                          <img 
                            src={getSafeImageUrl(aiScanBase64, 400, 85)} 
                            alt="Uploaded Scan" 
                            referrerPolicy="no-referrer"
                            onError={(e) => handleImageError(e)}
                            className="w-full h-full object-contain" 
                          />
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
                        <img 
                          src={getSafeImageUrl(generatedCase.imageUrl, 400, 85)} 
                          alt={generatedCase.title} 
                          referrerPolicy="no-referrer"
                          onError={(e) => handleImageError(e)}
                          className="w-full h-full object-cover" 
                        />
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
                              <span><FormattedText text={f} /></span>
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

                    {/* Scenario & Example Preview */}
                    {(generatedCase.caseScenario || generatedCase.caseExample) && (
                      <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 dark:text-indigo-200 uppercase tracking-wider">
                          <Stethoscope className="w-3.5 h-3.5" /> Patient Scenario & Clinical Example Preview
                        </div>
                        {generatedCase.caseScenario && (
                          <div className="text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-slate-900 dark:text-white">Scenario: </span>
                            <FormattedText text={generatedCase.caseScenario} />
                          </div>
                        )}
                        {generatedCase.caseExample && (
                          <div className="text-xs text-slate-700 dark:text-slate-300 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                            <span className="font-bold text-slate-900 dark:text-white">Management Example: </span>
                            <FormattedText text={generatedCase.caseExample} />
                          </div>
                        )}
                      </div>
                    )}
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
                            <img 
                              src={getSafeImageUrl(c.imageUrl, 200, 80)} 
                              alt={c.title} 
                              referrerPolicy="no-referrer"
                              onError={(e) => handleImageError(e)}
                              className="w-full h-full object-cover" 
                            />
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
                        <img 
                          src={getSafeImageUrl(imageUrl, 300, 85)} 
                          alt="Preview" 
                          referrerPolicy="no-referrer"
                          onError={(e) => handleImageError(e)}
                          className="w-full h-full object-cover" 
                        />
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
                          <img 
                            src={getSafeImageUrl(img.url, 300, 85)} 
                            alt={img.caption} 
                            referrerPolicy="no-referrer"
                            onError={(e) => handleImageError(e)}
                            className="w-full h-full object-cover" 
                          />
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
                    <FormattedTextarea
                      label="Key Radiographic Findings (One finding per line)"
                      value={keyFindings}
                      onChange={setKeyFindings}
                      rows={3}
                      placeholder="• Loss of **gray-white differentiation**&#10;• **Midline shift** of 4mm&#10;• Hyperdense **MCA sign**"
                      helpText="Tip: Highlight any word and click Bold or press Ctrl+B to emphasize critical findings."
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
                      <FormattedTextarea
                        label="Teaching Pearls / High-Yield Points (One per line)"
                        value={teachingPoints}
                        onChange={setTeachingPoints}
                        rows={2}
                        placeholder="Always inspect symmetrical structures&#10;Check **bone windows** for occult linear fractures"
                        helpText="Tip: Format with **bold** for key concepts."
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

                  {/* Dedicated Case Scenario & Clinical Example Section */}
                  <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                      <Stethoscope className="w-4 h-4" /> Case Scenario & Clinical Example (Bottom Case Section)
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Provide a realistic patient presentation scenario, an illustrative case radiograph / clinical condition image, and a real-world bedside management example.
                    </p>

                    <div>
                      <FormattedTextarea
                        label="Case Scenario (Patient Vignette & Presentation)"
                        value={caseScenario}
                        onChange={setCaseScenario}
                        rows={3}
                        placeholder="A 54-year-old male presents to the ED with acute onset severe pleuritic chest pain and dyspnea. Vital signs: BP 90/60 mmHg, HR 120 bpm, SpO2 88% on room air..."
                        helpText="Describe patient age, presenting triage complaints, vital signs, and bedside physical exam findings."
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Case Scenario Image & View
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                            Scenario Image URL (Leave blank to use primary image)
                          </label>
                          <input
                            type="text"
                            value={caseScenarioImageUrl}
                            onChange={(e) => setCaseScenarioImageUrl(e.target.value)}
                            placeholder="https://... (or upload file)"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                            Or Upload Scenario Image from Computer
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScenarioImageFileChange}
                            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300 hover:file:bg-indigo-100 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          Scenario Image Caption
                        </label>
                        <input
                          type="text"
                          value={caseScenarioImageCaption}
                          onChange={(e) => setCaseScenarioImageCaption(e.target.value)}
                          placeholder="e.g. Bedside portable radiograph taken upon emergency admission"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {(caseScenarioImageUrl || imageUrl) && (
                        <div className="flex items-center gap-3 pt-1">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-black border border-slate-300 dark:border-slate-700 flex-shrink-0">
                            <img
                              src={getSafeImageUrl(caseScenarioImageUrl || imageUrl, 200, 80)}
                              alt="Scenario Preview"
                              referrerPolicy="no-referrer"
                              onError={(e) => handleImageError(e)}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Scenario Image Configured</span>
                            <p className="truncate max-w-xs">{caseScenarioImageCaption || 'Standard presentation view'}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <FormattedTextarea
                        label="Case Example (Real-World Clinical Management & Resolution)"
                        value={caseExample}
                        onChange={setCaseExample}
                        rows={3}
                        placeholder="Emergency Management Protocol:&#10;1. Immediate high-flow oxygen and wide-bore IV access.&#10;2. Emergent needle thoracostomy in 2nd intercostal space.&#10;3. Tube thoracostomy with resolution of tension physiology on repeat radiograph."
                        helpText="Document the practical management steps, bedside intervention outcome, and clinician communication pearls."
                      />
                    </div>
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

          {/* --- TAB 3: REST WRITE API & N8N AUTOMATION HUB --- */}
          {activeTab === 'automation' && (
            <div className="space-y-6">
              {/* Top Banner & Status */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Cpu className="w-48 h-48 text-indigo-400" />
                </div>

                <div className="relative z-10 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold tracking-tight">RadMed Write API & n8n Autopilot</h2>
                        <p className="text-xs text-slate-300">Autonomously curate, format, and publish radiology teaching cases</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      API Online • Firestore Write Enabled
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                    Connect external automation systems (n8n, Make, custom cron jobs, or PubMed scrapers) to publish cases directly into the cloud database without manual entry.
                  </p>

                  {/* Credentials & API Quick Copy Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-400" /> Autopilot Ingestion URL
                        </span>
                        <button
                          onClick={() => handleCopy(`${window.location.origin}/api/admin/cases/curate-and-publish`, 'url-curate')}
                          className="hover:text-white flex items-center gap-1 text-[11px] text-blue-400"
                        >
                          {copiedField === 'url-curate' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedField === 'url-curate' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="font-mono text-xs text-emerald-300 break-all select-all bg-black/40 p-2 rounded-lg">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/api/admin/cases/curate-and-publish
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-amber-400" /> Admin Secret API Key
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowSecret(!showSecret)}
                            className="hover:text-white text-[11px] text-slate-400 flex items-center gap-1"
                          >
                            {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {showSecret ? 'Hide' : 'Show'}
                          </button>
                          <button
                            onClick={() => handleCopy(apiSecretKey, 'api-key')}
                            className="hover:text-white flex items-center gap-1 text-[11px] text-blue-400"
                          >
                            {copiedField === 'api-key' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedField === 'api-key' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                      <div className="font-mono text-xs text-amber-300 break-all select-all bg-black/40 p-2 rounded-lg">
                        {showSecret ? apiSecretKey : '••••••••••••••••••••••••••••••••'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Endpoints & Autonomy Methods Catalog */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-indigo-600" /> Available API Methods for n8n & Autonomous Agents
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Method 1 */}
                  <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-600 text-white">POST</span>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Autonomous</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">/api/admin/cases/curate-and-publish</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Pass only a topic or prompt. The server AI formats key findings, differential diagnoses, templates, and saves to Firestore.
                    </p>
                  </div>

                  {/* Method 2 */}
                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-600 text-white">POST</span>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Direct Ingest</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">/api/admin/cases</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Publish pre-structured ACR radiology cases generated directly by your n8n workflow nodes.
                    </p>
                  </div>

                  {/* Method 3 */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-600 text-white">POST</span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Bulk Batch</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">/api/admin/cases/batch</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Publish arrays of multiple cases in a single payload. Ideal for nightly automated curation feeds.
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive In-UI Live Test Workbench */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Send className="w-5 h-5 text-emerald-600" /> Interactive API Test Console
                    </h3>
                    <p className="text-xs text-slate-500">Test webhook delivery directly to verify Firestore database storage</p>
                  </div>

                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button
                      onClick={() => setTestEndpoint('curate')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        testEndpoint === 'curate'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Autopilot Curate
                    </button>
                    <button
                      onClick={() => setTestEndpoint('single')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        testEndpoint === 'single'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Structured JSON
                    </button>
                  </div>
                </div>

                {/* Form or JSON editor based on selected test endpoint */}
                {testEndpoint === 'curate' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                        Clinical Topic / Case Concept
                      </label>
                      <input
                        type="text"
                        value={curatePrompt}
                        onChange={(e) => setCuratePrompt(e.target.value)}
                        placeholder="e.g., Acute Subarachnoid Hemorrhage or Right Middle Lobe Pneumonia"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                          Modality
                        </label>
                        <select
                          value={curateModality}
                          onChange={(e) => setCurateModality(e.target.value as Modality)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                        >
                          <option value="chest_xray">Chest Radiograph (CXR)</option>
                          <option value="head_ct">Non-Contrast Head CT</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                          Category
                        </label>
                        <select
                          value={curateCategory}
                          onChange={(e) => setCurateCategory(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                        >
                          <option value="Emergency Findings">Emergency Findings</option>
                          <option value="Common Pathology">Common Pathology</option>
                          <option value="Normal">Normal Anatomy</option>
                          <option value="Post-Procedural">Post-Procedural</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Payload JSON Body
                    </label>
                    <textarea
                      rows={9}
                      value={manualPayloadJson}
                      onChange={(e) => setManualPayloadJson(e.target.value)}
                      className="w-full p-3.5 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 text-emerald-400 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 pt-2">
                  <button
                    onClick={handleTestApiCall}
                    disabled={isTestingApi}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isTestingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isTestingApi ? 'Executing Webhook Write...' : 'Execute Test API Call to Live DB'}
                  </button>

                  {apiTestStatus && (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                      apiTestStatus.includes('200')
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    }`}>
                      {apiTestStatus}
                    </span>
                  )}
                </div>

                {/* API Response Output Viewer */}
                {apiTestResponse && (
                  <div className="space-y-2 pt-2 animate-fade-in">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono font-semibold">Live Server Response</span>
                      <button
                        onClick={() => handleCopy(JSON.stringify(apiTestResponse, null, 2), 'test-resp')}
                        className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-[11px]"
                      >
                        {copiedField === 'test-resp' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedField === 'test-resp' ? 'Copied' : 'Copy Response'}
                      </button>
                    </div>
                    <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-60 border border-slate-800">
                      {JSON.stringify(apiTestResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Ready-to-Import n8n Workflow Blueprint */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileJson className="w-5 h-5 text-amber-500" /> 1-Click n8n Workflow Blueprint
                    </h3>
                    <p className="text-xs text-slate-500">Copy and paste directly into your n8n workflow canvas (Ctrl + V)</p>
                  </div>

                  <button
                    onClick={() => handleCopy(getN8nTemplateJson(), 'n8n-json')}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {copiedField === 'n8n-json' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedField === 'n8n-json' ? 'Workflow Copied!' : 'Copy n8n Canvas JSON'}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">How to load in n8n:</div>
                  <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal list-inside">
                    <li>Open your <span className="font-semibold text-slate-800 dark:text-slate-200">n8n canvas</span> in your browser.</li>
                    <li>Click the <span className="font-semibold text-amber-600 dark:text-amber-400">Copy n8n Canvas JSON</span> button above.</li>
                    <li>Click anywhere on the n8n canvas and press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px]">Ctrl + V</kbd> (or <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px]">Cmd + V</kbd>).</li>
                    <li>The complete Schedule + AI Topic Generator + HTTP Autopilot node pipeline will instantly appear ready to execute!</li>
                  </ol>
                </div>
              </div>

              {/* Code Snippets (cURL, Python, Node.js) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Code className="w-5 h-5 text-blue-600" /> Direct Integration Snippets
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold uppercase tracking-wider text-[11px]">cURL Example</span>
                    <button
                      onClick={() => handleCopy(`curl -X POST "${typeof window !== 'undefined' ? window.location.origin : ''}/api/admin/cases/curate-and-publish" \\\n  -H "Authorization: Bearer ${apiSecretKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "prompt": "Tension Pneumothorax",\n    "modality": "chest_xray",\n    "category": "Emergency Findings"\n  }'`, 'curl-snip')}
                      className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      {copiedField === 'curl-snip' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedField === 'curl-snip' ? 'Copied' : 'Copy cURL'}
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-950 text-blue-300 font-mono text-xs overflow-x-auto border border-slate-800">
{`curl -X POST "${typeof window !== 'undefined' ? window.location.origin : 'https://radmed.app'}/api/admin/cases/curate-and-publish" \\
  -H "Authorization: Bearer ${apiSecretKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Tension Pneumothorax",
    "modality": "chest_xray",
    "category": "Emergency Findings"
  }'`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB 4: PALPLUSS & M-PESA PAYMENT GATEWAY --- */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-8 shadow-xl border border-teal-800/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Smartphone className="w-48 h-48 text-emerald-400" />
                </div>

                <div className="relative z-10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold tracking-tight">PalPluss M-Pesa Gateway</h2>
                        <p className="text-xs text-slate-300">Fast, developer-friendly Safaricom M-Pesa STK Push API</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      PalPluss Ready • KES {priceKesInput} Price Active
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                    Configure your PalPluss API credentials to seamlessly trigger M-Pesa prompts directly to your users' phones without complex Daraja certificates.
                  </p>
                </div>
              </div>

              {/* Status or Alert notice */}
              {paymentNoticeMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 animate-fade-in shadow-sm text-xs sm:text-sm">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                  <span>{paymentNoticeMsg}</span>
                </div>
              )}

              {/* Configuration Form */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-600" /> Payment & Pricing Configuration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Active Provider */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Active Payment Engine
                    </label>
                    <select
                      value={providerInput}
                      onChange={(e) => setProviderInput(e.target.value as PaymentProvider)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="palpluss">PalPluss (M-Pesa API Key - Recommended)</option>
                      <option value="mpesa_daraja">Safaricom Daraja API Direct</option>
                      <option value="manual_mpesa">Manual M-Pesa Code Verification Only</option>
                    </select>
                  </div>

                  {/* Lifetime Price */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Lifetime Access Price (KES)
                    </label>
                    <input
                      type="number"
                      value={priceKesInput}
                      onChange={(e) => setPriceKesInput(Number(e.target.value))}
                      placeholder="1000"
                      min={1}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Free Cases Limit */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Free Cases Per Category
                    </label>
                    <input
                      type="number"
                      value={freeLimitInput}
                      onChange={(e) => setFreeLimitInput(Number(e.target.value))}
                      placeholder="5"
                      min={1}
                      max={50}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Till / Paybill Number */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Till / Paybill Number (Buy Goods)
                    </label>
                    <input
                      type="text"
                      value={paymentConfigState.paybillOrTillNumber || '1661655'}
                      onChange={(e) => setPaymentConfigState(prev => ({ 
                        ...prev, 
                        paybillOrTillNumber: e.target.value,
                        darajaBusinessShortcode: e.target.value 
                      }))}
                      placeholder="1661655"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Account Reference */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      M-Pesa Reference Label
                    </label>
                    <input
                      type="text"
                      value={paymentConfigState.accountReference || 'RadMed Pro'}
                      onChange={(e) => setPaymentConfigState(prev => ({ ...prev, accountReference: e.target.value }))}
                      placeholder="RadMed Pro"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* PalPluss API Key & Channel ID */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-500" /> PalPluss API Credentials
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {paymentConfigState.palplussApiKey ? `Key configured (${paymentConfigState.palplussApiKey})` : 'Key not set'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        PalPluss API Key (Live or Test)
                      </label>
                      <input
                        type="password"
                        value={palplussApiKeyInput}
                        onChange={(e) => setPalplussApiKeyInput(e.target.value)}
                        placeholder="pk_live_... or pk_test_..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Leave blank to keep existing key from environment.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        PalPluss Channel ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={palplussChannelInput}
                        onChange={(e) => setPalplussChannelInput(e.target.value)}
                        placeholder="e.g., ch_123456 or leave blank for default"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Optional channel identifier from your PalPluss dashboard.
                      </p>
                    </div>
                  </div>

                  {/* Actions: Save & Test */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isSavingPayment}
                      onClick={async () => {
                        setIsSavingPayment(true);
                        setPaymentNoticeMsg('');
                        const res = await updatePaymentConfig({
                          premiumPriceKes: priceKesInput,
                          freeCasesLimit: freeLimitInput,
                          activeProvider: providerInput,
                          palplussApiKey: palplussApiKeyInput || undefined,
                          palplussChannelId: palplussChannelInput || undefined,
                          paybillOrTillNumber: paymentConfigState.paybillOrTillNumber || '1661655',
                          darajaBusinessShortcode: paymentConfigState.paybillOrTillNumber || '1661655',
                          accountReference: paymentConfigState.accountReference,
                        });
                        setIsSavingPayment(false);
                        if (res.success) {
                          setPaymentNoticeMsg('Payment settings and PalPluss configuration updated successfully!');
                          if (res.config) setPaymentConfigState(res.config);
                          setTimeout(() => setPaymentNoticeMsg(''), 5000);
                        } else {
                          setPaymentNoticeMsg(`Error: ${res.error || 'Failed to update'}`);
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isSavingPayment ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Payment Settings
                    </button>

                    <button
                      type="button"
                      disabled={isTestingPalpluss}
                      onClick={async () => {
                        setIsTestingPalpluss(true);
                        setPalplussTestResult(null);
                        const res = await testPalPlussApi(palplussApiKeyInput || undefined);
                        setIsTestingPalpluss(false);
                        setPalplussTestResult(res);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isTestingPalpluss ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      Test PalPluss API Connection
                    </button>
                  </div>

                  {/* Test Result Display */}
                  {palplussTestResult && (
                    <div className={`p-4 rounded-2xl text-xs space-y-2 border ${
                      palplussTestResult.success 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                    }`}>
                      <div className="flex items-center gap-2 font-bold">
                        {palplussTestResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {palplussTestResult.success ? 'PalPluss Connection Verified!' : 'PalPluss Connection Issue'}
                      </div>
                      <p>{palplussTestResult.message || palplussTestResult.error}</p>
                      {palplussTestResult.data && (
                        <pre className="p-2.5 rounded-xl bg-black/40 text-emerald-300 font-mono text-[11px] overflow-x-auto">
                          {JSON.stringify(palplussTestResult.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>

                {/* Webhook Callback Info */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider block text-[11px]">
                    PalPluss Webhook Callback URL:
                  </span>
                  <div className="font-mono text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 break-all select-all">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://radmed-chi.vercel.app'}/api/payment/palpluss/callback
                  </div>
                  <p className="text-[11px]">
                    PalPluss will post real-time M-Pesa transaction confirmations (payment success, receipts, and user phone numbers) to this endpoint for instant automated library unlocking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB 5: SECURITY & ADMIN PASSWORD --- */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Admin Security & Password</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage your administrator credentials and access security for this terminal.
                  </p>
                </div>
              </div>

              {changePasswordSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <span>{changePasswordSuccess}</span>
                </div>
              )}

              {changePasswordError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{changePasswordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Current Admin Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    New Admin Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Enter new password (min. 6 characters)"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Choose a strong password with letters, numbers, and symbols.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
                  />
                  {newPasswordInput && confirmPasswordInput && (
                    <div className="mt-1 text-[11px]">
                      {newPasswordInput === confirmPasswordInput ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Passwords match
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                          <X className="w-3 h-3" /> Passwords do not match
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword || !newPasswordInput || newPasswordInput !== confirmPasswordInput}
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isUpdatingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Update Admin Password
                  </button>
                </div>
              </form>

              {/* Security Storage Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Password Synchronization
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your updated admin password is automatically synchronized with your Cloud Firestore security configuration (<code className="font-mono text-amber-600 dark:text-amber-400">/settings/admin</code>) and cached locally so you can securely log in from any authorized device.
                </p>
              </div>
            </div>
          )}

          {/* --- TAB 6: DATABASE TERMINAL & CLI SHELL --- */}
          {activeTab === 'terminal' && (
            <DatabaseTerminal
              cases={cases}
              onRefreshCases={onRefreshCases || (async () => {})}
            />
          )}

          {/* --- TAB 7: SYSTEM & SYNC DIAGNOSTICS --- */}
          {activeTab === 'diagnostics' && (
            <DiagnosticPanel
              cases={cases}
              onRefreshCases={onRefreshCases || (async () => {})}
            />
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
                    <img 
                      src={getSafeImageUrl(c.imageUrl, 200, 80)} 
                      alt={c.imageAlt || c.title} 
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e)}
                      className="w-full h-full object-cover" 
                    />
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
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
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
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
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
      )}

      {/* --- CHANGE PASSWORD MODAL --- */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Change Admin Password</h3>
                  <p className="text-[11px] text-slate-500">Update your administrator credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {changePasswordSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{changePasswordSuccess}</span>
              </div>
            )}

            {changePasswordError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{changePasswordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
                  required
                />
                {newPasswordInput && confirmPasswordInput && (
                  <div className="mt-1 text-[11px]">
                    {newPasswordInput === confirmPasswordInput ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                        <X className="w-3 h-3" /> Passwords do not match
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword || !newPasswordInput || newPasswordInput !== confirmPasswordInput}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isUpdatingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
