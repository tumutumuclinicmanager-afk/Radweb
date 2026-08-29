export type Modality = 'chest_xray' | 'head_ct';

export type Category = 'All' | 'Normal' | 'Common Pathology' | 'Emergency Findings' | 'Post-Procedural';

export interface MedicalCase {
  id: string;
  title: string;
  modality: Modality;
  category: 'Normal' | 'Common Pathology' | 'Emergency Findings' | 'Post-Procedural';
  imageUrl: string;
  imageAlt: string;
  question: string;
  diagnosis: string;
  keyFindings: string[];
  clinicalSignificance: string;
  differentialDiagnosis: string[];
  reportingTemplate: string;
  teachingPoints: string[];
  cmeTip: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  orderIndex?: number;
  createdAt?: number | string;
  galleryImages?: { url: string; caption: string }[];
}

export type ActiveView = 'home' | 'cases' | 'flashcards' | 'disclaimer' | 'quiz' | 'admin' | 'interpretation';

export type PaymentProvider = 'palpluss' | 'mpesa_daraja' | 'manual_mpesa' | 'paystack' | 'stripe';

export interface PaymentTransaction {
  id: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  phoneNumber: string;
  amount: number;
  currency: string;
  mpesaReceiptNumber?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  provider: PaymentProvider;
  resultDesc?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentConfig {
  freeCasesLimit: number;
  premiumPriceKes: number;
  activeProvider: PaymentProvider;
  palplussApiKey?: string;
  palplussChannelId?: string;
  darajaEnvironment: 'sandbox' | 'production';
  darajaBusinessShortcode: string;
  paybillOrTillNumber: string;
  accountReference: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  isPremium: boolean;
  mpesaReceiptNumber?: string;
  phoneNumber?: string;
  unlockedAt?: string;
  provider?: string;
  createdAt?: string;
}

