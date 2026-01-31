
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import FriendRequest from '../models/FriendRequest';

export const getFriends = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const user = await User.findOne({ user_id: userId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const friends = await User.find({ user_id: { $in: user.friends } })
            .select('user_id user_name avatarUrl bio');

        res.json(friends);
    } catch (err) {
        next(err);
    }
};

export const sendRequest = async (req: Request, res: Response, next: NextFunction) => {
    const fromUser = req.user?.user_id;
    const { targetUserId } = req.body;

    if (!fromUser) return res.status(401).json({ message: 'Unauthorized' });

    if (fromUser === targetUserId) {
        return res.status(400).json({ message: "Cannot friend yourself" });
    }

    try {
        // Check if already friends
        const sender = await User.findOne({ user_id: fromUser });
        if (sender?.friends.includes(targetUserId)) {
            return res.status(400).json({ message: "Already friends" });
        }

        // Check for existing request
        const existing = await FriendRequest.findOne({
            fromUser,
            toUser: targetUserId,
            status: 'pending'
        });

        if (existing) {
            return res.status(400).json({ message: "Request already pending" });
        }

        const request = new FriendRequest({ fromUser, toUser: targetUserId });
        await request.save();

        res.status(201).json({ message: "Friend request sent" });
    } catch (err) {
        next(err);
    }
};

export const getRequests = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const requests = await FriendRequest.find({
            toUser: userId,
            status: 'pending'
        }).populate({
            path: 'fromUser',
            select: 'user_name avatarUrl',
            model: User,
            match: { user_id: { $ne: null } }
        });

        // Manual populate since ref is string user_id
        const requestData = await Promise.all(requests.map(async (r) => {
            const sender = await User.findOne({ user_id: r.fromUser }).select('user_name avatarUrl');
            return {
                _id: r._id,
                fromUser: r.fromUser,
                senderName: sender?.user_name,
                senderAvatar: sender?.avatarUrl,
                createdAt: r.createdAt
            };
        }));

        res.json(requestData);
    } catch (err) {
        next(err);
    }
};

export const respondToRequest = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.user_id;
    const { requestId, status } = req.body; // status: 'accepted' | 'rejected'

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
        const request = await FriendRequest.findById(requestId);
        if (!request) return res.status(404).json({ message: "Request not found" });

        if (request.toUser !== userId) {
            return res.status(403).json({ message: "Not your request" });
        }

        request.status = status;
        await request.save();

        if (status === 'accepted') {
            await User.updateOne({ user_id: request.fromUser }, { $addToSet: { friends: request.toUser } });
            await User.updateOne({ user_id: request.toUser }, { $addToSet: { friends: request.fromUser } });
        }

        res.json({ message: `Request ${status} ` });
    } catch (err) {
        next(err);
    }
};
