import express, { Response } from 'express';
import { User } from '../models/User';
import { verifyToken, AuthRequest } from '../middlewares/verifyToken';
import DailyStep from '../models/dailyStep.model';
import logger from '../utils/logger';

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(verifyToken);

// ─────────────────────────────────────────────────────────
// GET /api/users/search?query=<string>
// Find users by display name or email (case-insensitive)
// ─────────────────────────────────────────────────────────
router.get('/search', async (req: AuthRequest, res: Response) => {
    try {
        const { query } = req.query as { query?: string };

        if (!query || !query.trim()) {
            return res.status(400).json({ message: 'Query parameter is required' });
        }

        const regex = new RegExp(query.trim(), 'i');

        const users = await User.find({
            $or: [
                { displayName: { $regex: regex } },
                { email: { $regex: regex } },
            ],
            isActive: true,
        })
            .limit(30);

        const mapped = users.map((u) => ({
            _id: u._id,
            createdAt: u.createdAt,
            displayName: u.displayName,
            email: u.email,
            isActive: u.isActive,
            lastLoginAt: u.lastLoginAt,
            photoURL: u.photoURL,
            provider: u.provider,
            role: u.role,
            uid: u.uid,
            xp: u.xp,
        }));

        console.log('Users found:', mapped);

        return res.status(200).json({ users: mapped });
    } catch (err) {
        logger.error('User search error:', { error: err });
        return res.status(500).json({ message: 'Error searching users' });
    }
});

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ─────────────────────────────────────────────────────────
// POST /api/users/steps/sync
// Upsert per-day step counts. Last write wins per (userId, isoDate).
// Accepts either a single entry or a batch:
//   { userId, isoDate, steps }
//   { userId, days: [{ isoDate, steps }, ...] }
// ─────────────────────────────────────────────────────────
router.post('/steps/sync', async (req: AuthRequest, res: Response) => {
    try {
        const { userId, isoDate, steps, days } = req.body as {
            userId?: string;
            isoDate?: string;
            steps?: number;
            days?: { isoDate?: string; steps?: number }[];
        };

        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ message: 'userId is required' });
        }

        // Security authorization check: only self or admin can sync steps
        if (userId !== req.user!.uid && req.user!.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: You cannot sync steps for another user.' });
        }

        const entries: { isoDate: string; steps: number }[] = [];
        if (Array.isArray(days)) {
            for (const d of days) {
                if (!d || typeof d.isoDate !== 'string' || !ISO_DATE_RE.test(d.isoDate)) {
                    return res.status(400).json({ message: 'Each day requires isoDate (YYYY-MM-DD)' });
                }
                if (typeof d.steps !== 'number' || !Number.isFinite(d.steps) || d.steps < 0) {
                    return res.status(400).json({ message: 'Each day requires non-negative numeric steps' });
                }
                entries.push({ isoDate: d.isoDate, steps: Math.floor(d.steps) });
            }
        } else {
            if (typeof isoDate !== 'string' || !ISO_DATE_RE.test(isoDate)) {
                return res.status(400).json({ message: 'isoDate (YYYY-MM-DD) is required' });
            }
            if (typeof steps !== 'number' || !Number.isFinite(steps) || steps < 0) {
                return res.status(400).json({ message: 'steps must be a non-negative number' });
            }
            entries.push({ isoDate, steps: Math.floor(steps) });
        }

        if (entries.length === 0) {
            return res.status(400).json({ message: 'No step entries provided' });
        }

        const ops = entries.map((e) => ({
            updateOne: {
                filter: { user_id: userId, dateKey: e.isoDate },
                update: { $set: { steps: e.steps } },
                upsert: true,
            },
        }));

        await DailyStep.bulkWrite(ops, { ordered: false });

        return res.status(200).json({
            updated: entries.length,
            days: entries.map((e) => ({ isoDate: e.isoDate, steps: e.steps })),
        });
    } catch (err) {
        logger.error('Steps sync error:', { error: err });
        return res.status(500).json({ message: 'Error syncing steps' });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/users/weekly-steps?userId=<uid>
// Returns last 7 days of step data, oldest → newest (today last).
// Shape: { days: [{ isoDate, steps }, ...7 entries] }
// ─────────────────────────────────────────────────────────
router.get('/weekly-steps', async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.query as { userId?: string };

        const targetUserId = userId || req.user!.uid;

        // Security authorization check: only self or admin can view step history
        if (targetUserId !== req.user!.uid && req.user!.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: You cannot view other users\' step counts.' });
        }

        const days: { isoDate: string; steps: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push({ isoDate: d.toISOString().slice(0, 10), steps: 0 });
        }

        const dateKeys = days.map((d) => d.isoDate);

        const records = await DailyStep.find({
            user_id: targetUserId,
            dateKey: { $in: dateKeys },
        }).select('dateKey steps');

        const stepMap: Record<string, number> = {};
        for (const r of records) {
            stepMap[r.dateKey] = r.steps;
        }
        for (const day of days) {
            if (stepMap[day.isoDate] !== undefined) {
                day.steps = stepMap[day.isoDate];
            }
        }

        return res.status(200).json({ days });
    } catch (err) {
        logger.error('Weekly steps error:', { error: err });
        return res.status(500).json({ message: 'Error fetching weekly steps' });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/users/leaderboard/global  (alias → same as /leaderboard)
// GET /api/users/leaderboard          (original)
// Fetch top users platform-wide sorted by xp
//
// NOTE: these specific sub-paths must be declared BEFORE
//       /leaderboard/friends/:userId to avoid route shadowing.
// ─────────────────────────────────────────────────────────
const globalLeaderboardHandler = async (_req: AuthRequest, res: Response) => {
    try {
        const users = await User.find({ isActive: true })
            .sort({ xp: -1 })
            .limit(20);

        const mapped = users.map((u) => ({
            _id: u._id,
            createdAt: u.createdAt,
            displayName: u.displayName,
            email: u.email,
            isActive: u.isActive,
            lastLoginAt: u.lastLoginAt,
            photoURL: u.photoURL,
            provider: u.provider,
            role: u.role,
            uid: u.uid,
            xp: u.xp,
        }));

        return res.status(200).json({ users: mapped });
    } catch (err) {
        logger.error('Leaderboard error:', { error: err });
        return res.status(500).json({ message: 'Error fetching leaderboard' });
    }
};

router.get('/leaderboard/global', globalLeaderboardHandler);
router.get('/leaderboard', globalLeaderboardHandler);

// ─────────────────────────────────────────────────────────
// GET /api/users/leaderboard/friends/:userId
// Fetch leaderboard restricted to a user's friend list
// (friends are stored as UIDs in the `chats` array)
// ─────────────────────────────────────────────────────────
router.get('/leaderboard/friends/:userId', async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: 'userId param is required' });
        }

        // Security authorization check: only self or admin can view friends leaderboard
        if (userId !== req.user!.uid && req.user!.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: You cannot view this leaderboard.' });
        }

        // Fetch the requesting user to get their friends list
        const user = await User.findOne({ uid: userId }).select('chats');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const friendUids: string[] = user.chats || [];

        // Include the user themselves in the leaderboard
        const uidsToQuery = [...new Set([userId, ...friendUids])];

        const users = await User.find({ uid: { $in: uidsToQuery }, isActive: true })
            .sort({ xp: -1 })
            .limit(20);

        const mapped = users.map((u) => ({
            _id: u._id,
            createdAt: u.createdAt,
            displayName: u.displayName,
            email: u.email,
            isActive: u.isActive,
            lastLoginAt: u.lastLoginAt,
            photoURL: u.photoURL,
            provider: u.provider,
            role: u.role,
            uid: u.uid,
            xp: u.xp,
        }));

        return res.status(200).json({ users: mapped });
    } catch (err) {
        logger.error('Friends leaderboard error:', { error: err });
        return res.status(500).json({ message: 'Error fetching friends leaderboard' });
    }
});

// ─────────────────────────────────────────────────────────
// PUT /api/users/profile/update
// Update the authenticated user's physical metrics & prefs
// ─────────────────────────────────────────────────────────
router.put('/profile/update', async (req: AuthRequest, res: Response) => {
    logger.info('Updating user profile...');
    try {
        const { uid } = req.user!;
        const { display_name, height_cm, weight_kg, bmi, diet } = req.body;

        // Validate display_name
        if (!display_name || !display_name.trim()) {
            return res.status(400).json({ message: 'Display name is required' });
        }

        // Validate height_cm
        if (height_cm !== undefined && (typeof height_cm !== 'number' || height_cm < 50 || height_cm > 300)) {
            return res.status(400).json({ message: 'Invalid height value' });
        }

        // Validate weight_kg
        if (weight_kg !== undefined && (typeof weight_kg !== 'number' || weight_kg < 10 || weight_kg > 500)) {
            return res.status(400).json({ message: 'Invalid weight value' });
        }

        // Validate diet
        if (diet !== undefined && !['veg', 'nonveg'].includes(diet)) {
            return res.status(400).json({ message: 'Invalid diet value' });
        }

        const updateFields: Record<string, any> = {
            displayName: display_name.trim(),
            ...(height_cm !== undefined && { height_cm }),
            ...(weight_kg !== undefined && { weight_kg }),
            ...(bmi !== undefined && { bmi }),
            ...(diet !== undefined && { diet }),
        };

        const user = await User.findOneAndUpdate(
            { uid },
            { $set: updateFields },
            { returnDocument: 'after', runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                user_id: user.uid,
                user_name: user.displayName,
                user_email: user.email,
                height_cm: user.height_cm,
                weight_kg: user.weight_kg,
                bmi: user.bmi,
                diet: user.diet,
                xp: user.xp,
                updated_at: user.updatedAt,
            },
        });
    } catch (err) {
        logger.error('Profile update error:', { error: err });
        return res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
