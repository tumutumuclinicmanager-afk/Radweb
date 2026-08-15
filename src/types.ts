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
  galleryImages?: { url: string; caption: string }[];
}

export type ActiveView = 'home' | 'cases' | 'flashcards' | 'disclaimer' | 'quiz' | 'admin' | 'interpretation';
