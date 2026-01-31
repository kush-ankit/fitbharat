import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Activity from '../models/Activity';

export const getGlobalLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    const timeframe = req.query.timeframe || 'all';

    try {
        const users = await User.find()
            .sort({ 'stats.totalDistance': -1 })
            .limit(50)
            .select('user_id user_name avatarUrl stats');

        res.json(users);
    } catch (err) {
        next(err);
    }
};

export const getPathLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    const { pathId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    try {
        const leaderboard = await Activity.aggregate([
            { $match: { pathId: pathId } },
            { $sort: { duration: 1 } },
            {
                $group: {
                    _id: "$userId",
                    bestTime: { $first: "$duration" },
                    activityId: { $first: "$_id" },
                    date: { $first: "$startTime" }
                }
            },
            { $sort: { bestTime: 1 } },
            { $limit: limit }
        ]);

        const results = await Promise.all(leaderboard.map(async (entry) => {
            const user = await User.findOne({ user_id: entry._id }).select('user_name avatarUrl');
            return {
                userId: entry._id,
                userName: user?.user_name || 'Unknown',
                avatarUrl: user?.avatarUrl,
                time: entry.bestTime,
                date: entry.date
            };
        }));

        res.json(results);
    } catch (err) {
        next(err);
    }
};
