import { Router, Response } from 'express';
import { verifyToken, AuthRequest } from '../middlewares/verifyToken';
import { User } from '../models/User';
import logger from '../utils/logger';

const router = Router();

// POST /api/auth/sync
// Called after every sign-in to upsert the user in MongoDB
router.post('/sync', verifyToken, async (req: AuthRequest, res: Response) => {
    logger.info("Syncing user logic triggered...");
    const { uid, email, name, picture, email_verified, firebase } = req.user!;

    const provider = firebase?.sign_in_provider || 'password';

    const user = await User.findOneAndUpdate(
        { uid },
        {
            $set: {
                uid,
                email: email!,
                displayName: name,
                photoURL: picture,
                emailVerified: email_verified ?? false,
                provider,
                lastLoginAt: new Date(),
            },
            $setOnInsert: {
                role: 'user',
                isActive: true,
            },
        },
        {
            upsert: true,      // create if doesn't exist
            returnDocument: 'after',  // return updated doc
            runValidators: true,
        }
    );

    return res.status(200).json({
        success: true,
        user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: user.role,
            isActive: user.isActive,
        },
    });
});

// GET /api/auth/me — get current user profile
router.get('/me', verifyToken, async (req: AuthRequest, res: Response) => {
    logger.info(`Getting profile for user: ${req.user!.uid}`);
    const user = await User.findOne({ uid: req.user!.uid }).select('-__v');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ success: true, user });
});

export default router;