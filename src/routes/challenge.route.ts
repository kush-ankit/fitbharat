import express from 'express';
import { getChallenges, joinChallenge, createChallenge } from '../controllers/challenge.controller';
import { verifyToken } from '../controllers/authController';

const router = express.Router();

console.log('Loading Challenge Routes');

// Public? Or Auth?
router.get('/', (req, res, next) => {
    console.log('GET /challenges hit');
    next();
}, getChallenges);

// Auth required for joining
router.post('/join', async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'No token' });
    const result = await verifyToken(token);
    if (result.success) {
        (req as any).user = result.user;
        next();
    } else {
        res.status(401).json({ message: 'Invalid token' });
    }
}, joinChallenge);

router.post('/create', createChallenge);

export default router;
