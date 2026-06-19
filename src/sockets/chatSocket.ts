import { Namespace, Server, Socket } from 'socket.io';
import Message from '../models/message.model';
import { User } from '../models/User';
import IMessage from '../types/message.types';
import logger from '../utils/logger';

const userSocketMap: { [key: string]: Set<string> } = {}; // userId -> Set of socketIds
const socketUserMap: { [key: string]: string } = {}; // socketId -> userId

export default (messagesIO: Namespace, socket: Socket) => {
    logger.debug(`User Connected: ${socket.id}`);

    const user = (socket as any).user;
    const userId = user?.uid || user?.user_id;

    if (userId) {
        if (!userSocketMap[userId]) {
            userSocketMap[userId] = new Set();
        }
        userSocketMap[userId].add(socket.id);
        socketUserMap[socket.id] = userId;
        logger.debug(`Mapped user ${userId} to socket ${socket.id}`);
    }

    // socket.on("typing", (room) => {
    //     socket.to(room).emit("typing", room);
    // });

    // socket.on("stopTyping", (room) => {
    //     socket.to(room).emit("stopTyping", room);
    // });

    socket.on("getChatHistory", async ({ receiver_user_id }) => {
        logger.debug(`getChatHistory trigger to ${receiver_user_id}`);
        const sender_user_id = user?.uid || user?.user_id;
        try {
            if (typeof receiver_user_id !== 'string') {
                logger.warn("Invalid receiver_user_id type in getChatHistory");
                return;
            }
            // Resolve to Firebase UID if MongoDB _id is passed
            let resolvedReceiverId = receiver_user_id;
            if (resolvedReceiverId.length === 24) {
                const receiverUser = await User.findById(resolvedReceiverId);
                if (receiverUser) resolvedReceiverId = receiverUser.uid;
            }

            const messages = await Message.find({
                $or: [
                    { sender_user_id: sender_user_id, receiver_user_id: resolvedReceiverId },
                    { sender_user_id: resolvedReceiverId, receiver_user_id: sender_user_id }
                ]
            })
                .sort({ created_at: -1 });
            socket.emit("getChatHistoryResponse", messages.reverse());
        } catch (error) {
            logger.error("Error fetching chat history:", { error });
        }
    });

    socket.on("getAllChatList", async () => {
        try {
            const userId = user?.uid || user?.user_id;
            const userchats = await User.findOne({ uid: userId });

            if (!userchats) {
                logger.warn(`User chats not found for uid ${userId}`);
                socket.emit("getAllChatListError", { message: "User not found" });
                return;
            }
            // Find users where user_id is in the chat_id array
            const users = await User.find({ uid: { $in: userchats.chats } }).select('-password');

            // Map the output to ensure ONLY the requested details are exposed
            const mappedUsers = users.map(u => ({
                _id: u._id,
                createdAt: u.createdAt,
                displayName: u.displayName,
                email: u.email,
                isActive: u.isActive,
                lastLoginAt: u.lastLoginAt,
                photoURL: u.photoURL,
                provider: u.provider,
                role: u.role,
                uid: u.uid,
                xp: u.xp,
            }));
            socket.emit("getAllChatListResponse", mappedUsers);
        } catch (error: any) {
            logger.error("Error fetching chat list users:", { error });
            socket.emit("getAllChatListError", { message: "Internal Server Error", error: error.message });
        }
    });

    socket.on("sendMessage", async (data: IMessage) => {
        logger.debug("sendMessage triggered");

        // Inject the sender user id from the authenticated socket session if missing
        if (!data.sender_user_id && userId) {
            data.sender_user_id = userId;
        }

        if (!data.sender_user_id || typeof data.receiver_user_id !== 'string' || !data.text_massage) {
            logger.warn("Missing or invalid required fields on sendMessage logic", { data });
            return;
        }

        // Save to DB
        try {
            // Resolve to Firebase UID if MongoDB _id is passed for receiver
            let resolvedReceiverId = data.receiver_user_id;
            if (resolvedReceiverId.length === 24) {
                const receiverUser = await User.findById(resolvedReceiverId);
                if (receiverUser) resolvedReceiverId = receiverUser.uid;
            }
            data.receiver_user_id = resolvedReceiverId;

            const newMessage = new Message(data);
            await newMessage.save();

            const receiverSocketIds = userSocketMap[resolvedReceiverId];
            if (receiverSocketIds) {
                receiverSocketIds.forEach(socketId => {
                    messagesIO.to(socketId).emit("receiveMessage", newMessage);
                });
            }

        } catch (error) {
            logger.error("Error sending message:", { error });
        }
    });

    socket.on("disconnect", () => {
        // console.log("User Disconnected", socket.id);
        const userId = socketUserMap[socket.id];
        if (userId) {
            const userSockets = userSocketMap[userId];
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    delete userSocketMap[userId];
                }
            }
            delete socketUserMap[socket.id];
        }
    });
};
