import { Request, Response, NextFunction } from 'express';
import Challenge from '../models/Challenge';
import Activity from '../models/Activity';

export const getChallenges = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const now = new Date();
        const challenges = await Challenge.find({
            endDate: { $gte: now }
        });
        res.json(challenges);
    } catch (err) {
        next(err);
    }
};

export const joinChallenge = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.user_id;
    const { challengeId } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

        if (challenge.participants.includes(userId)) {
            return res.status(400).json({ message: 'Already joined' });
        }

        challenge.participants.push(userId);
        await challenge.save();

        res.json({ message: 'Joined challenge', challenge });
    } catch (err) {
        next(err);
    }
};

// Admin only? Or auto-generated. 
export const createChallenge = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const challenge = new Challenge(req.body);
        await challenge.save();
        res.status(201).json(challenge);
    } catch (err) {
        next(err);
    }
};
