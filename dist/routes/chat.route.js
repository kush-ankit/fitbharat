"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Chat_1 = __importDefault(require("../models/Chat"));
const User_1 = __importDefault(require("../models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
// create a new chat for add friend
router.post("/addfriend", async (req, res) => {
    try {
        const { user, friend } = req.body;
        console.log("user", user);
        console.log("friend", friend);
        if (!user || !friend ||
            typeof user.user_id !== "string" ||
            typeof friend.user_id !== "string" ||
            user.user_id === friend.user_id) {
            return res.status(400).json({ message: "Invalid user data" });
        }
        const userId = user.user_id;
        const friendId = friend.user_id;
        const chat = await Chat_1.default.findOne({ chat_id: { $in: [userId, friendId] } });
        if (chat) {
            return res.status(400).json({ message: "Chat already exists", chat });
        }
        await Promise.all([
            User_1.default.updateOne({ user_id: userId }, { $addToSet: { user_chats: friendId } }),
            User_1.default.updateOne({ user_id: friendId }, { $addToSet: { user_chats: userId } }),
        ]);
        return res.status(200).json({ message: "Chat created", chat });
    }
    catch (error) {
        console.error("Error creating chat:", error);
        return res.status(500).json({ message: "Server error" });
    }
});
router.get('/getAllChatsOfUser', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token || !process.env.JWT_SECRET) {
            return res.status(401).json({ message: 'Missing or invalid token' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);
        const user = await User_1.default.findOne({ userid: decoded.userId });
        console.log('user:', user);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const chats = await Chat_1.default.find({ chat_id: { $in: user.chats } });
        console.log('chats:', chats);
        return res.status(200).json({ chats });
    }
    catch (error) {
        console.error('Error in /getAllChatsOfUser:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
