import express, { Request, Response } from 'express';
import Chat from '../models/Chat';
import { User } from '../models/User';
import { verifyToken, AuthRequest } from '../middlewares/verifyToken';
import logger from '../utils/logger';

const router = express.Router();

// create a new chat for add friend
router.post("/addfriend", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { friend, user } = req.body;

        // Extract authenticated user ID, and friend's ID from body
        const userId = user?.uid;
        const friendId = friend?.user_id || friend?.uid;

        if (!friendId || userId === friendId) {
            return res.status(400).json({ message: "Invalid user data" });
        }

        // Check if already friends
        const currentUser = await User.findOne({ uid: userId });
        if (currentUser?.chats?.includes(friendId)) {
            return res.status(400).json({ message: "User is already in your friends list" });
        }

        // Add each other to their `chats` array (which acts as the friend list)
        await Promise.all([
            User.updateOne({ uid: userId }, { $addToSet: { chats: friendId } }),
            User.updateOne({ uid: friendId }, { $addToSet: { chats: userId } }),
        ]);

        return res.status(200).json({ message: "Friend added successfully" });

    } catch (error) {
        logger.error("Error adding friend:", { error });
        return res.status(500).json({ message: "Server error" });
    }
});

router.get('/getAllChatsOfUser', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.uid;

        const user = await User.findOne({ uid: userId });

        logger.debug('User fetched in getAllChatsOfUser', { userId: user?.uid });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const chats = await Chat.find({ chat_id: { $in: user.chats } });
        logger.debug('Chats loaded', { count: chats.length });

        return res.status(200).json({ chats });

    } catch (error) {
        logger.error('Error in /getAllChatsOfUser:', { error });
        return res.status(500).json({ message: 'Server error' });
    }
});

export default router;
