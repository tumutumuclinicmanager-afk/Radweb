import { MedicalCase, Modality } from '../types';

export interface ResearchCaseParams {
  prompt?: string;
  modality?: Modality;
  category?: 'Normal' | 'Common Pathology' | 'Emergency Findings' | 'Post-Procedural';
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  imageBase64?: string;
  mimeType?: string;
  imageUrl?: string;
}

export interface BatchResearchParams {
  topic: string;
  count?: number;
  modality?: Modality;
}

export async function researchCaseWithAI(params: ResearchCaseParams): Promise<MedicalCase> {
  const response = await fetch('/api/ai/research-case', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Non-JSON response received from /api/ai/research-case:', text.slice(0, 200));
    throw new Error(`Server returned status ${response.status} (${response.statusText}).`);
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Server responded with status ${response.status}`);
  }

  if (!data.success || !data.case) {
    throw new Error(data.error || 'Failed to generate medical case.');
  }

  return data.case as MedicalCase;
}

export async function batchResearchCasesWithAI(params: BatchResearchParams): Promise<MedicalCase[]> {
  const response = await fetch('/api/ai/batch-research', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Non-JSON response received from /api/ai/batch-research:', text.slice(0, 200));
    throw new Error(`Server returned status ${response.status} (${response.statusText}).`);
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Server responded with status ${response.status}`);
  }

  if (!data.success || !data.cases) {
    throw new Error(data.error || 'Failed to generate batch cases.');
  }

  return data.cases as MedicalCase[];
}
