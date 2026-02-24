import { Request, Response } from 'express';
import crypto from 'crypto';
import { AiCheckinRecord } from '../ai/schema';

const checkinStore = new Map<string, AiCheckinRecord>();

export const uploadAiCheckin = async (req: Request, res: Response) => {
  const contentType = req.headers['content-type'] || '';

  const id = `chk_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const record: AiCheckinRecord = {
    id,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    source: 'image-upload',
  };

  checkinStore.set(id, record);

  return res.status(202).json({
    checkinId: id,
    status: record.status,
    acceptedContentType: contentType,
    note: 'Phase 0 placeholder: upload is accepted but not yet processed.',
  });
};

export const getAiCheckinById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const record = checkinStore.get(id);

  if (!record) {
    return res.status(404).json({
      message: 'AI check-in not found',
      checkinId: id,
    });
  }

  return res.status(200).json(record);
};
