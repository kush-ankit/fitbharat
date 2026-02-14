import { Request, Response } from 'express';
import User from '../models/User';

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    // Sort by points desc, then distance desc
    // Limit to top 20 users
    const users = await User.find({})
      .select('username points distance image')
      .sort({ points: -1, distance: -1 })
      .limit(20);

    res.status(200).json(users);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
};
