import express from 'express';
import { getAiCheckinById, uploadAiCheckin } from '../controllers/aiCheckin.controller';

const router = express.Router();

router.post('/upload', uploadAiCheckin);
router.get('/:id', getAiCheckinById);

export default router;
