"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const message_model_1 = __importDefault(require("../models/message.model"));
const User_1 = __importDefault(require("../models/User"));
const userSocketMap = {}; // userId -> socketId
const socketUserMap = {}; // socketId -> userId
const SocketUserMap = {};
exports.default = (io, socket) => {
    console.log(`User Connected: ${socket.id}`);
    const user = socket.user;
    if (user) {
        userSocketMap[user.user_id] = socket.id;
        socketUserMap[socket.id] = user.user_id;
        console.log(`Mapped user ${user.user_id} to socket ${socket.id}`);
        console.log(`Mapped socket ${socket.id} to user ${user.user_id}`);
    }
    // socket.on("typing", (room) => {
    //     socket.to(room).emit("typing", room);
    // });
    // socket.on("stopTyping", (room) => {
    //     socket.to(room).emit("stopTyping", room);
    // });
    socket.on("getChatHistory", async ({ receiver_user_id }) => {
        console.log("getChatHistory", receiver_user_id);
        const sender_user_id = user.user_id;
        try {
            const messages = await message_model_1.default.find({
                $or: [
                    { sender_user_id: sender_user_id, receiver_user_id: receiver_user_id },
                    { sender_user_id: receiver_user_id, receiver_user_id: sender_user_id }
                ]
            })
                .sort({ created_at: -1 });
            socket.emit("getChatHistoryResponse", messages.reverse());
        }
        catch (error) {
            console.error("Error fetching chat history:", error);
        }
    });
    socket.on("getAllChatList", async () => {
        try {
            const userchats = await User_1.default.findOne({ user_id: user.user_id });
            console.log("userchats", userchats);
            if (!userchats) {
                socket.emit("getAllChatListError", { message: "User not found" });
                return;
            }
            // Find users where user_id is in the chat_id array
            const users = await User_1.default.find({ user_id: { $in: userchats.user_chats } }).select('-user_password');
            socket.emit("getAllChatListResponse", users);
        }
        catch (error) {
            console.error("Error fetching chat list users:", error);
            socket.emit("getAllChatListError", { message: "Internal Server Error", error: error.message });
        }
    });
    socket.on("sendMessage", async (data) => {
        if (!data.sender_user_id || !data.receiver_user_id || !data.text_massage) {
            console.error("Missing required fields:", { data });
            return;
        }
        // Save to DB
        try {
            const newMessage = new message_model_1.default(data);
            await newMessage.save();
            const receiverSocketId = userSocketMap[data.receiver_user_id];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receiveMessage", newMessage);
            }
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
