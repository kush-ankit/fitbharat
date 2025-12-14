import express, { Request, Response } from 'express';
import Chat from '../models/Chat';
import User from '../models/User';

const router = express.Router();

const getPrivateChatRoomName = (userId1: string, userId2: string) => {
    const sortedIds = [userId1, userId2].sort();
    return `private_${sortedIds[0]}_${sortedIds[1]}`;
};

const saveChatFunction = async (req: Request, res: Response) => {
    try {
        const { user1, user2 } = req.body;

        if (
            !user1 || !user2 ||
            typeof user1.userid !== "string" ||
            typeof user2.userid !== "string" ||
            user1.userid === user2.userid
        ) {
            return res.status(400).json({ message: "Invalid user data" });
        }

        const userId1 = user1.userid;
        const userId2 = user2.userid;
        const chatid = getPrivateChatRoomName(userId1, userId2);

        let chat = await Chat.findOne({ chatid });
        console.log("Chat found:", chat);
        if (chat) {
            return res.status(400).json({ message: "Chat already exists", chat });
        }

        chat = new Chat({
            chatid,
            isGroup: false,
            image: null,
            members: [user1, user2]
        });

        await chat.save();

        await Promise.all([
            User.updateOne({ userid: userId1 }, { $addToSet: { chats: chatid } }),
            User.updateOne({ userid: userId2 }, { $addToSet: { chats: chatid } }),
        ]);

        return res.status(200).json({ message: "Chat created", chat });

    } catch (error) {
        console.error("Error creating chat:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

router.post("/private", saveChatFunction);

export default router;
