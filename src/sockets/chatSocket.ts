import { Namespace, Server, Socket } from 'socket.io';
import Message from '../models/message.model';
import User from '../models/User';
import IUser from '../types/user.types';
import IMessage from '../types/message.types';

const userSocketMap: { [key: string]: string } = {}; // userId -> socketId
const socketUserMap: { [key: string]: string } = {}; // socketId -> userId

const SocketUserMap: { [key: string]: string } = {};

export default (messagesIO: Namespace, socket: Socket) => {
    console.log(`User Connected: ${socket.id}`);

    const user = (socket as any).user as IUser;
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
            const messages = await Message.find({
                $or: [
                    { sender_user_id: sender_user_id, receiver_user_id: receiver_user_id },
                    { sender_user_id: receiver_user_id, receiver_user_id: sender_user_id }
                ]
            })
                .sort({ created_at: -1 });
            socket.emit("getChatHistoryResponse", messages.reverse());
        } catch (error) {
            console.error("Error fetching chat history:", error);
        }
    });

    socket.on("getAllChatList", async () => {
        try {
            const userchats = await User.findOne({ user_id: user.user_id });
            console.log("userchats", userchats);
            if (!userchats) {
                socket.emit("getAllChatListError", { message: "User not found" });
                return;
            }
            // Find users where user_id is in the chat_id array
            const users = await User.find({ user_id: { $in: userchats.user_chats } }).select('-user_password');
            socket.emit("getAllChatListResponse", users);
        } catch (error: any) {
            console.error("Error fetching chat list users:", error);
            socket.emit("getAllChatListError", { message: "Internal Server Error", error: error.message });
        }
    });

    socket.on("sendMessage", async (data: IMessage) => {

        if (!data.sender_user_id || !data.receiver_user_id || !data.text_massage) {
            console.error("Missing required fields:", { data });
            return;
        }
        // Save to DB
        try {
            const newMessage = new Message(data);
            await newMessage.save();

            const receiverSocketId = userSocketMap[data.receiver_user_id];
            if (receiverSocketId) {
                messagesIO.to(receiverSocketId).emit("receiveMessage", newMessage);
            }


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
