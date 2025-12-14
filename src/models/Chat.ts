import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
    chatid: string;
    isGroup: boolean;
    image?: string;
    members: any[]; // Array of user objects { _id, name, email, userid }
}

const ChatSchema: Schema = new Schema({
    chatid: {
        type: String,
        unique: true,
        required: true,
    },
    isGroup: {
        type: Boolean,
        default: false,
    },
    image: {
        type: String,
        default: null,
    },
    members: {
        type: [Object], // Array of user objects { _id, name, email, userid }
        required: true,
    },
});

const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);
export default Chat;
