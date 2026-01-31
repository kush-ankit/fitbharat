import express from 'express';
import { getGlobalLeaderboard, getPathLeaderboard } from '../controllers/leaderboard.controller';

const router = express.Router();

router.get('/global', getGlobalLeaderboard);
router.get('/path/:pathId', getPathLeaderboard);

export default router;
