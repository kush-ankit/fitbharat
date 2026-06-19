import express from 'express';
import { savePath, getNearbyPaths, getPathById } from '../controllers/path.controller';
import { verifyToken } from '../middlewares/verifyToken';

const router = express.Router();

router.use(verifyToken);

router.post('/save-path', savePath);

router.get('/nearby-paths', getNearbyPaths);

router.get('/get-path-by-id/:id', getPathById);

export default router;

