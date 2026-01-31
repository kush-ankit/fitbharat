import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import RaceSession from '../models/RaceSession';


export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query.query as string;
    if (!query) return res.status(400).json({ message: 'Search query is required' });

    try {
        const users = await User.find({
            $or: [
                { user_name: { $regex: query, $options: 'i' } },
                { user_email: { $regex: query, $options: 'i' } }
            ]
        }).select('-user_password');
        res.json({ users });
    } catch (err) {
        next(err);
    }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.user_id || req.query.userId;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User ID missing' });
    }

    try {
        const sessions = await RaceSession.find({
            'participants.userId': userId
        }).sort({ createdAt: -1 });

        res.json({ history: sessions });
    } catch (err) {
        next(err);
    }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.user_id; // Using req.user directly now
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const user = await User.findOne({ user_id: userId }).select('-user_password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        next(err);
    }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const updates = req.body;
        // Whitelist allowed updates
        const allowedUpdates = ['user_name', 'bio', 'avatarUrl', 'weight', 'pushToken'];
        const actualUpdates: any = {};

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                actualUpdates[key] = updates[key];
            }
        });

        const user = await User.findOneAndUpdate(
            { user_id: userId },
            { $set: actualUpdates, updatedAt: new Date() },
            { new: true }
        ).select('-user_password');

        res.json(user);
    } catch (err) {
        next(err);
    }
};

export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    try {
        const user = await User.findOne({ user_id: userId }).select('-user_password -user_email -pushToken');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        next(err);
    }
};
