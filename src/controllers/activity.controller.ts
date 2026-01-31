import { Request, Response, NextFunction } from 'express';
import Activity from '../models/Activity';
import User from '../models/User';

export const saveActivity = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.user_id;
    const { pathId, distance, duration, calories, routePolyline, startTime, endTime } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const activity = new Activity({
            userId,
            pathId,
            distance,
            duration,
            calories,
            routePolyline,
            startTime,
            endTime
        });
        await activity.save();

        // Update user stats
        await User.updateOne(
            { user_id: userId },
            { $inc: { 'stats.totalDistance': distance } }
        );

        res.status(201).json(activity);
    } catch (err) {
        next(err);
    }
};

export const getActivities = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.user_id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const activities = await Activity.find({ userId })
            .sort({ startTime: -1 })
            .skip(offset)
            .limit(limit);
        res.json(activities);
    } catch (err) {
        next(err);
    }
};

export const getActivityById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
        const activity = await Activity.findById(id);
        if (!activity) return res.status(404).json({ message: 'Activity not found' });
        res.json(activity);
    } catch (err) {
        next(err);
    }
};
