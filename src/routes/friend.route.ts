import express from 'express';
import { getFriends, sendRequest, getRequests, respondToRequest } from '../controllers/friend.controller';
import { verifyToken } from '../controllers/authController';

const router = express.Router();

// Middleware to populate req.user
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

router.get('/', getFriends);
router.post('/request', sendRequest);
router.get('/request', getRequests); // Get pending requests
router.put('/request', respondToRequest);

export default router;
