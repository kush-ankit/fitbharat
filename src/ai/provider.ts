import fs from 'fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface StructuredAiInsights {
  modelVersion: string;
  generatedAt: string;
  summary: string;
  bodyFatEstimate?: {
    value: number;
    unit: '%';
    confidence: number;
  };
  segments: Array<{ name: string; confidence: number; note?: string }>;
  warnings?: string[];
}

const parseJsonSafe = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const analyzeProgressImage = async (imagePath: string): Promise<{ raw: unknown; structured: StructuredAiInsights }> => {
  const provider = process.env.AI_CHECKIN_PROVIDER || 'gemini';
  const model = process.env.AI_CHECKIN_MODEL || 'gemini-3.1-pro-preview';

  if (provider !== 'gemini' || !process.env.GEMINI_API_KEY) {
    const fallback: StructuredAiInsights = {
      modelVersion: 'fallback-local-v1',
      generatedAt: new Date().toISOString(),
      summary: 'AI provider not configured. Stored upload successfully; analysis fallback was used.',
      segments: [],
      warnings: ['Provider not configured. Set GEMINI_API_KEY and AI_CHECKIN_PROVIDER=gemini.'],
    };
    return { raw: { fallback: true }, structured: fallback };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const gemini = genAI.getGenerativeModel({ model });

  const buffer = await fs.readFile(imagePath);
  const base64 = buffer.toString('base64');
  const mime = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const prompt = `You are a conservative fitness progress analyst. Return ONLY valid JSON with this exact schema:
{
  "summary": string,
  "bodyFatEstimate": { "value": number, "unit": "%", "confidence": number } | null,
  "segments": [{ "name": string, "confidence": number, "note": string }],
  "warnings": string[]
}
Rules: Be uncertainty-aware. Do not provide medical diagnosis. Keep summary <= 60 words.`;

  const resp = await gemini.generateContent([
    { text: prompt },
    { inlineData: { mimeType: mime, data: base64 } },
  ]);

  const rawText = resp.response.text() || '{}';
  const parsed = parseJsonSafe(rawText) || {};

  const structured: StructuredAiInsights = {
    modelVersion: model,
    generatedAt: new Date().toISOString(),
    summary: typeof parsed.summary === 'string' ? parsed.summary : 'Analysis completed.',
    bodyFatEstimate:
      parsed.bodyFatEstimate && typeof parsed.bodyFatEstimate?.value === 'number'
        ? {
          value: parsed.bodyFatEstimate.value,
          unit: '%',
          confidence:
            typeof parsed.bodyFatEstimate.confidence === 'number'
              ? Math.min(1, Math.max(0, parsed.bodyFatEstimate.confidence))
              : 0.5,
        }
        : undefined,
    segments: Array.isArray(parsed.segments)
      ? parsed.segments
        .map((s: any) => ({
          name: String(s?.name || 'segment'),
          confidence: typeof s?.confidence === 'number' ? Math.min(1, Math.max(0, s.confidence)) : 0.5,
          note: typeof s?.note === 'string' ? s.note : undefined,
        }))
        .slice(0, 12)
      : [],
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map((w: any) => String(w)) : [],
  };

  return { raw: { rawText, model }, structured };
};
