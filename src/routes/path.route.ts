import express from 'express';
import { savePath, getNearbyPaths } from '../controllers/path.controller';

const router = express.Router();

router.post('/save-path', savePath);

router.get('/nearby-paths', getNearbyPaths);

export default router;

