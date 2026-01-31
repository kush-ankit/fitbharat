import express from 'express';
import { registerDevice, getNotifications } from '../controllers/notification.controller';
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

router.post('/device', registerDevice);
router.get('/', getNotifications);

export default router;
