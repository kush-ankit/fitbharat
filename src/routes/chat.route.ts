import express, { Request, Response } from 'express';
import Chat from '../models/Chat';
import User from '../models/User';
import IUser from '../types/User.types';
import jwt from 'jsonwebtoken';

const router = express.Router();

// create a new chat for add friend
router.post("/addfriend", async (req: Request, res: Response) => {
    try {
        const { user, friend }: { user: IUser, friend: IUser } = req.body;
        console.log("user", user);
        console.log("friend", friend);
        if (
            !user || !friend ||
            typeof user.user_id !== "string" ||
            typeof friend.user_id !== "string" ||
            user.user_id === friend.user_id
        ) {
            return res.status(400).json({ message: "Invalid user data" });
        }



        const userId = user.user_id;
        const friendId = friend.user_id;

        const chat = await Chat.findOne({ chat_id: { $in: [userId, friendId] } });
        if (chat) {
            return res.status(400).json({ message: "Chat already exists", chat });
        }

        await Promise.all([
            User.updateOne({ user_id: userId }, { $addToSet: { user_chats: friendId } }),
            User.updateOne({ user_id: friendId }, { $addToSet: { user_chats: userId } }),
        ]);

        return res.status(200).json({ message: "Chat created", chat });

    } catch (error) {
        console.error("Error creating chat:", error);
        return res.status(500).json({ message: "Server error" });
    }
});

router.get('/getAllChatsOfUser', async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token || !process.env.JWT_SECRET) {
            return res.status(401).json({ message: 'Missing or invalid token' });
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

        console.log('Decoded token:', decoded);

        const user = await User.findOne({ userid: decoded.userId });

        console.log('user:', user);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const chats = await Chat.find({ chat_id: { $in: user.chats } });
        console.log('chats:', chats);

        return res.status(200).json({ chats });

    } catch (error) {
        console.error('Error in /getAllChatsOfUser:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

export default router;
