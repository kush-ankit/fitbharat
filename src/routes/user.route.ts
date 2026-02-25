import express, { Request, Response } from 'express';
import User from '../models/User';
import DailyStep from '../models/dailyStep.model';

const router = express.Router();

// GET /leaderboard - Fetch top users by points/distance
router.get('/leaderboard', async (req: Request, res: Response) => {
    try {
        const users = await User.find({})
            .select('user_name points distance user_image')
            .sort({ points: -1, distance: -1 })
            .limit(20);

        res.json({ users });
    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
});

router.get('/search', async (req: Request, res: Response) => {
    const query = req.query.query as string;

    console.log("query", query);


    if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
    }

    try {
        const users = await User.find({
            $or: [
                { user_name: { $regex: query, $options: 'i' } },
                { user_email: { $regex: query, $options: 'i' } }
            ]
        }).select('-user_password');
        console.log("users", users);

        res.json({ users });
    } catch (err) {
        console.error('User search error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const toDateKey = (date: Date): string => {
    return date.toISOString().slice(0, 10);
};

const dayLabel = (date: Date): string => {
    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return labels[date.getDay()];
};

router.post('/steps', async (req: Request, res: Response) => {
    try {
        const { userId, steps, dateKey } = req.body || {};

        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ message: 'userId is required' });
        }

        const safeSteps = Number(steps);
        if (!Number.isFinite(safeSteps) || safeSteps < 0) {
            return res.status(400).json({ message: 'steps must be a non-negative number' });
        }

        const finalDateKey = typeof dateKey === 'string' && dateKey.trim().length > 0
            ? dateKey
            : toDateKey(new Date());

        const record = await DailyStep.findOneAndUpdate(
            { user_id: userId, dateKey: finalDateKey },
            { $set: { steps: Math.floor(safeSteps) } },
            { upsert: true, new: true }
        );

        return res.json({
            ok: true,
            record: {
                userId: record.user_id,
                dateKey: record.dateKey,
                steps: record.steps,
            },
        });
    } catch (err) {
        console.error('POST /users/steps error:', err);
        return res.status(500).json({ message: 'Failed to save steps' });
    }
});

// GET /users/steps/today?userId=<id> - Fetch today's step count for a user
router.get('/steps/today', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;

        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ message: 'userId query parameter is required' });
        }

        const todayKey = toDateKey(new Date());

        const record = await DailyStep.findOne({
            user_id: userId,
            dateKey: todayKey,
        }).lean();

        return res.json({ steps: record ? Math.max(0, Number(record.steps) || 0) : 0 });
    } catch (err) {
        console.error('GET /users/steps/today error:', err);
        return res.status(500).json({ message: 'Failed to fetch today\'s steps' });
    }
});

router.get('/weekly-steps', async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const today = new Date();
        const dates: Date[] = [];
        for (let i = 6; i >= 0; i -= 1) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            dates.push(d);
        }

        const dateKeys = dates.map(toDateKey);

        const records = await DailyStep.find({
            user_id: userId,
            dateKey: { $in: dateKeys },
        }).lean();

        const byKey = new Map(records.map((r: any) => [r.dateKey, Math.max(0, Number(r.steps) || 0)]));

        const days = dates.map((d) => {
            const key = toDateKey(d);
            return {
                dateKey: key,
                label: dayLabel(d),
                steps: byKey.get(key) ?? 0,
            };
        });

        const totalSteps = days.reduce((sum, d) => sum + d.steps, 0);

        return res.json({
            userId,
            range: {
                from: days[0]?.dateKey,
                to: days[6]?.dateKey,
            },
            days,
            totalSteps,
        });
    } catch (err) {
        console.error('GET /users/weekly-steps error:', err);
        return res.status(500).json({
            message: 'Failed to fetch weekly steps',
            days: [],
        });
    }
});

export default router;
