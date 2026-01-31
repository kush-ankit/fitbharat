import express from 'express';
import { saveActivity, getActivities, getActivityById } from '../controllers/activity.controller';
import { verifyToken } from '../controllers/authController';

const router = express.Router();

router.use(async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'No token' });
    const result = await verifyToken(token);
    if (result.success) {
        (req as any).user = result.user;
        next();
    } else {
        res.status(401).json({ message: 'Invalid token' });
    }
});

router.post('/', saveActivity);
router.get('/', getActivities);
router.get('/:id', getActivityById);

export default router;
