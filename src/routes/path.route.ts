import express from 'express';
import { savePath, getNearbyPaths, getPathById } from '../controllers/path.controller';

const router = express.Router();

router.post('/save-path', savePath);

router.get('/nearby-paths', getNearbyPaths);

router.get('/get-path-by-id/:id', getPathById);

export default router;

