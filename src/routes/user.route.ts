import express from 'express';
import { searchUsers, getHistory, getProfile, updateProfile, getUserProfile } from '../controllers/user.controller';
import { verifyToken } from '../controllers/authController';


const router = express.Router();

// Auth middleware for profile management
const authMiddleware = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'No token' });
    const result = await verifyToken(token);
    if (result.success) {
        req.user = result.user;
        next();
    } else {
        res.status(401).json({ message: 'Invalid token' });
    }
};

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/search', searchUsers);
router.get('/history', getHistory);
router.get('/:userId', getUserProfile);

export default router;
