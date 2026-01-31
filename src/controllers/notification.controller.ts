import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Notification from '../models/Notification';

export const registerDevice = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.user_id;
    const { pushToken, os } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!pushToken) return res.status(400).json({ message: 'Token required' });

    try {
        await User.updateOne({ user_id: userId }, { pushToken });
        res.json({ message: 'Device registered' });
    } catch (err) {
        next(err);
    }
};

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (err) {
        next(err);
    }
};

// Helper internal function to send push (Placeholder)
export const sendPushNotification = async (userId: string, title: string, body: string) => {
    // 1. Get user token
    // 2. Send via Expo/FCM
    // 3. Save to DB
    try {
        await Notification.create({ userId, title, message: body });
        // Actual push logic here...
    } catch (e) {
        console.error("Push error", e);
    }
};
