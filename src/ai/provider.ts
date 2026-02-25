import fs from 'fs/promises';
import OpenAI from 'openai';

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
  const provider = process.env.AI_CHECKIN_PROVIDER || 'openai';
  const model = process.env.AI_CHECKIN_MODEL || 'gpt-4.1-mini';

  if (provider !== 'openai' || !process.env.OPENAI_API_KEY) {
    const fallback: StructuredAiInsights = {
      modelVersion: 'fallback-local-v1',
      generatedAt: new Date().toISOString(),
      summary: 'AI provider not configured. Stored upload successfully; analysis fallback was used.',
      segments: [],
      warnings: ['Provider not configured. Set OPENAI_API_KEY and AI_CHECKIN_PROVIDER=openai.'],
    };
    return { raw: { fallback: true }, structured: fallback };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

  const resp = await client.responses.create({
    model,
    temperature: 0.2,
    max_output_tokens: 500,
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: prompt },
          { type: 'input_image', image_url: `data:${mime};base64,${base64}`, detail: 'low' },
        ],
      },
    ],
  });

  const rawText = resp.output_text || '{}';
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

  return { raw: { rawText, responseId: resp.id }, structured };
};
