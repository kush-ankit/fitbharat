"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const message_model_1 = __importDefault(require("../models/message.model"));
const userSocketMap = {}; // userId -> socketId
const socketUserMap = {}; // socketId -> userId
const groupMembers = {
    "group_1": ["user_1", "user_2", "user_3"],
    "group_2": ["user_4", "user_5"]
};
exports.default = (io, socket) => {
    // console.log(`User Connected: ${socket.id}`);
    // Get user from auth middleware
    const user = socket.user;
    if (user) {
        userSocketMap[user._id] = socket.id;
        socketUserMap[socket.id] = user._id;
        console.log(`Mapped user ${user._id} to socket ${socket.id}`);
        // Join groups
        for (const groupId in groupMembers) {
            if (groupMembers[groupId].includes(user._id)) {
                socket.join(groupId);
                console.log(`User ${user._id} joined group ${groupId}`);
            }
        }
    }
    socket.on("typing", (room) => {
        socket.to(room).emit("typing", room);
    });
    socket.on("stopTyping", (room) => {
        socket.to(room).emit("stopTyping", room);
    });
    socket.on("getChatHistory", async ({ chatId, page = 1, limit = 20 }) => {
        try {
            const messages = await message_model_1.default.find({ chatId })
                .sort({ timestamp: -1 })
                .skip((page - 1) * limit)
                .limit(limit);
            socket.emit("chatHistory", messages.reverse());
        }
        catch (error) {
            console.error("Error fetching chat history:", error);
        }
    });
    socket.on("sendMessage", async (data) => {
        const { chatId, sender, receiver, text } = data;
        // Save to DB
        try {
            const newMessage = new message_model_1.default({ chatId, sender, receiver, text });
            await newMessage.save();
            // Emit to receiver
            // Check if receiver is a group or user
            // For simplicity, assuming chatId is room/group ID or direct chat ID
            // If direct chat, we might need logic to determine socket ID of receiver
            // If chatId is a room/group:
            io.to(chatId).emit("receiveMessage", newMessage);
            // If direct message logic is needed:
            // const receiverSocketId = userSocketMap[receiver];
            // if (receiverSocketId) {
            //   io.to(receiverSocketId).emit("receiveMessage", newMessage);
            // }
        }
        catch (error) {
            console.error("Error sending message:", error);
        }
    });
    socket.on("disconnect", () => {
        // console.log("User Disconnected", socket.id);
        const userId = socketUserMap[socket.id];
        if (userId) {
            delete userSocketMap[userId];
            delete socketUserMap[socket.id];
        }
    });
};
