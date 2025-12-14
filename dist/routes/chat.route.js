"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Chat_1 = __importDefault(require("../models/Chat"));
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
const getPrivateChatRoomName = (userId1, userId2) => {
    const sortedIds = [userId1, userId2].sort();
    return `private_${sortedIds[0]}_${sortedIds[1]}`;
};
const saveChatFunction = async (req, res) => {
    try {
        const { user1, user2 } = req.body;
        if (!user1 || !user2 ||
            typeof user1.userid !== "string" ||
            typeof user2.userid !== "string" ||
            user1.userid === user2.userid) {
            return res.status(400).json({ message: "Invalid user data" });
        }
        const userId1 = user1.userid;
        const userId2 = user2.userid;
        const chatid = getPrivateChatRoomName(userId1, userId2);
        let chat = await Chat_1.default.findOne({ chatid });
        console.log("Chat found:", chat);
        if (chat) {
            return res.status(400).json({ message: "Chat already exists", chat });
        }
        chat = new Chat_1.default({
            chatid,
            isGroup: false,
            image: null,
            members: [user1, user2]
        });
        await chat.save();
        await Promise.all([
            User_1.default.updateOne({ userid: userId1 }, { $addToSet: { chats: chatid } }),
            User_1.default.updateOne({ userid: userId2 }, { $addToSet: { chats: chatid } }),
        ]);
        return res.status(200).json({ message: "Chat created", chat });
    }
    catch (error) {
        console.error("Error creating chat:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat management
 */
/**
 * @swagger
 * /chat/private:
 *   post:
 *     summary: Create or retrieve a private chat
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user1:
 *                 type: object
 *                 properties:
 *                   userid:
 *                     type: string
 *               user2:
 *                 type: object
 *                 properties:
 *                   userid:
 *                     type: string
 *     responses:
 *       200:
 *         description: Chat created or retrieved
 *       400:
 *         description: Invalid user data or chat already exists
 *       500:
 *         description: Server error
 */
router.post("/private", saveChatFunction);
exports.default = router;
