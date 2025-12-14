import { Server, Socket } from 'socket.io';
import Message from '../models/message.model';
import User from '../models/User';

const userSocketMap: { [key: string]: string } = {}; // userId -> socketId
const socketUserMap: { [key: string]: string } = {}; // socketId -> userId

export default (io: Server, socket: Socket) => {
    // console.log(`User Connected: ${socket.id}`);

    // Get user from auth middleware
    const user = (socket as any).user;
    if (user) {
        userSocketMap[user._id] = socket.id;
        socketUserMap[socket.id] = user._id;
        console.log(`Mapped user ${user._id} to socket ${socket.id}`);

        // Join chats dynamically from DB
        User.findById(user._id).then(userDoc => {
            if (userDoc && userDoc.chats) {
                userDoc.chats.forEach((chatId: string) => {
                    socket.join(chatId);
                    console.log(`User ${user._id} joined chat ${chatId}`);
                });
            }
        }).catch(err => {
            console.error(`Error fetching user chats for socket connection: ${err}`);
        });
    }

    socket.on("typing", (room) => {
        socket.to(room).emit("typing", room);
    });

    socket.on("stopTyping", (room) => {
        socket.to(room).emit("stopTyping", room);
    });

    socket.on("getChatHistory", async ({ chatId, page = 1, limit = 20 }) => {
        try {
            const messages = await Message.find({ chatId })
                .sort({ timestamp: -1 })
                .skip((page - 1) * limit)
                .limit(limit);
            socket.emit("chatHistory", messages.reverse());
        } catch (error) {
            console.error("Error fetching chat history:", error);
        }
    });

    socket.on("sendMessage", async (data) => {
        const { chatId, receiver, text } = data;

        if (!user || !user._id) {
            console.error("User not authenticated, cannot send message");
            return;
        }

        if (!receiver || !text || !chatId) {
            console.error("Missing required fields:", { chatId, receiver, text });
            return;
        }

        // Save to DB
        try {
            const newMessage = new Message({
                chatId,
                sender: user._id,
                receiver,
                text
            });
            await newMessage.save();

            // Emit to room (chatId) which both users should have joined
            io.to(chatId).emit("receiveMessage", newMessage);

        } catch (error) {
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
