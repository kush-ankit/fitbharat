import { Request, Response } from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
import AiCheckin from '../models/aiCheckin.model';
import { analyzeProgressImage } from '../ai/provider';
import { buildRecommendations } from '../ai/recommendationEngine';

const uploadsDir = path.resolve(process.cwd(), 'uploads', 'ai-checkins');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const getUserIdFromRequest = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return undefined;

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    return decoded?.user_id || decoded?.id;
  } catch {
    return undefined;
  }
};

const runAnalysisInBackground = async (id: string) => {
  const checkin = await AiCheckin.findById(id);
  if (!checkin) return;

  try {
    checkin.status = 'processing';
    await checkin.save();

    const { raw, structured } = await analyzeProgressImage(checkin.imagePath);
    const recommendations = buildRecommendations(structured);

    checkin.status = 'completed';
    checkin.rawModelOutput = raw;
    checkin.result = structured;
    checkin.recommendations = recommendations;
    checkin.modelProvider = process.env.AI_CHECKIN_PROVIDER || 'fallback';
    checkin.modelName = process.env.AI_CHECKIN_MODEL || 'fallback-local-v1';
    await checkin.save();
  } catch (error: any) {
    checkin.status = 'failed';
    checkin.error = error?.message || 'AI analysis failed';
    await checkin.save();
  }
};

export const uploadAiCheckin = async (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    return res.status(400).json({ message: 'Image file is required (multipart/form-data, field name: image).' });
  }

  const consentAccepted = String(req.body?.consentAccepted || 'false') === 'true';
  const disclaimerAccepted = String(req.body?.disclaimerAccepted || 'false') === 'true';

  if (!consentAccepted || !disclaimerAccepted) {
    return res.status(400).json({ message: 'Consent and disclaimer acceptance are required.' });
  }

  const userId = getUserIdFromRequest(req);

  const created = await AiCheckin.create({
    userId,
    status: 'queued',
    source: 'image-upload',
    imagePath: file.path,
    mimeType: file.mimetype,
    fileSize: file.size,
    consentAccepted,
    disclaimerAccepted,
    modelProvider: process.env.AI_CHECKIN_PROVIDER || 'openai',
    modelName: process.env.AI_CHECKIN_MODEL || 'gpt-4.1-mini',
  });

  void runAnalysisInBackground(String(created._id));

  return res.status(202).json({
    checkinId: created._id,
    status: created.status,
    message: 'Upload accepted and queued for analysis.',
  });
};

export const getAiCheckinById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const record = await AiCheckin.findById(id).lean();

  if (!record) {
    return res.status(404).json({
      message: 'AI check-in not found',
      checkinId: id,
    });
  }

  return res.status(200).json({
    id: record._id,
    userId: record.userId,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    result: record.result,
    recommendations: record.recommendations,
    error: record.error,
  });
};

export const getLatestAiCheckin = async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const record = await AiCheckin.findOne({ userId }).sort({ createdAt: -1 }).lean();

    if (!record) {
      return res.status(404).json({ message: 'No AI check-ins found', userId });
    }

    return res.status(200).json({
      id: record._id,
      userId: record.userId,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      result: record.result,
      recommendations: record.recommendations,
      error: record.error,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch latest AI check-in', error: error?.message });
  }
};
