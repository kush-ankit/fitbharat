import mongoose, { Schema, Document } from 'mongoose';
import IChat from '../types/chat.types';

const ChatSchema: Schema = new Schema({
    chatid: {
        type: String,
        unique: true,
        required: true,
    },
    chat_members_user_id: {
        type: [String],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);
export default Chat;
