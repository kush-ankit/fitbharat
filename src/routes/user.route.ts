import express, { Request, Response } from 'express';
import User from '../models/User';

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

export default router;
