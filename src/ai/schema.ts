export type AiCheckinStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface AiCheckinBodySegment {
  name: string;
  confidence: number; // 0..1
  note?: string;
}

export interface AiCheckinRecommendations {
  trainingFocus: string[];
  nutritionFocus: string[];
  recoveryFocus: string[];
}

export interface AiCheckinModelOutput {
  modelVersion: string;
  generatedAt: string; // ISO date-time
  summary: string;
  bodyFatEstimate?: {
    value: number;
    unit: '%';
    confidence: number; // 0..1
  };
  segments: AiCheckinBodySegment[];
  recommendations: AiCheckinRecommendations;
  warnings?: string[];
}

export interface AiCheckinRecord {
  id: string;
  userId?: string;
  status: AiCheckinStatus;
  createdAt: string;
  updatedAt: string;
  source: 'image-upload';
  result?: AiCheckinModelOutput;
  error?: string;
}
