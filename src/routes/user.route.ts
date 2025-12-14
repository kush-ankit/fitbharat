import express, { Request, Response } from 'express';
import User from '../models/User';

const router = express.Router();

router.get('/search', async (req: Request, res: Response) => {
    const query = req.query.query as string;

    if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
    }

    try {
        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        }).select('-password');
        console.log("users", users);

        res.json({ users });
    } catch (err) {
        console.error('User search error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
