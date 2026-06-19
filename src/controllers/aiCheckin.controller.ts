import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import AiCheckin from '../models/aiCheckin.model';
import { analyzeProgressImage } from '../ai/provider';
import { buildRecommendations } from '../ai/recommendationEngine';
import { AuthRequest } from '../middlewares/verifyToken';

const uploadsDir = path.resolve(process.cwd(), 'uploads', 'ai-checkins');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

export const uploadAiCheckin = async (req: AuthRequest, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    return res.status(400).json({ message: 'Image file is required (multipart/form-data, field name: image).' });
  }

  const consentAccepted = String(req.body?.consentAccepted || 'false') === 'true';
  const disclaimerAccepted = String(req.body?.disclaimerAccepted || 'false') === 'true';

  if (!consentAccepted || !disclaimerAccepted) {
    return res.status(400).json({ message: 'Consent and disclaimer acceptance are required.' });
  }

  const userId = req.user!.uid;

  const created = await AiCheckin.create({
    userId,
    status: 'queued',
    source: 'image-upload',
    imagePath: file.path,
    mimeType: file.mimetype,
    fileSize: file.size,
    consentAccepted,
    disclaimerAccepted,
    modelProvider: process.env.AI_CHECKIN_PROVIDER || 'gemini',
    modelName: process.env.AI_CHECKIN_MODEL || 'gemini-3.1-pro-preview',
  });

  void runAnalysisInBackground(String(created._id));

  return res.status(202).json({
    checkinId: created._id,
    status: created.status,
    message: 'Upload accepted and queued for analysis.',
  });
};

export const getAiCheckinById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const record = await AiCheckin.findById(id).lean();

  if (!record) {
    return res.status(404).json({
      message: 'AI check-in not found',
      checkinId: id,
    });
  }

  // Authorization check: only owner or admin can view
  if (record.userId !== req.user!.uid && req.user!.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: You cannot access this check-in.' });
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

export const getLatestAiCheckin = async (req: AuthRequest, res: Response) => {
  try {
    const authUserId = req.user!.uid;
    const targetUserId = (req.query.userId as string) || authUserId;

    // Authorization check: only self or admin can access
    if (targetUserId !== authUserId && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You cannot access other users\' data.' });
    }

    const record = await AiCheckin.findOne({ userId: targetUserId }).sort({ createdAt: -1 }).lean();

    if (!record) {
      return res.status(404).json({ message: 'No AI check-ins found', userId: targetUserId });
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
