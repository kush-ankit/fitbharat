export type AiCheckinStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface AiCheckinBodySegment {
  name: string;
  confidence: number;
  note?: string;
}

export interface AiCheckinRecommendations {
  trainingFocus: string[];
  nutritionFocus: string[];
  recoveryFocus: string[];
}

export interface AiCheckinModelOutput {
  modelVersion: string;
  generatedAt: string;
  summary: string;
  bodyFatEstimate?: {
    value: number;
    unit: '%';
    confidence: number;
  };
  segments: AiCheckinBodySegment[];
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
  recommendations?: AiCheckinRecommendations;
  error?: string;
}
