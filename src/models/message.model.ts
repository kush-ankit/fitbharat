import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    chatId: string;
    sender: string;
    receiver: string;
    text: string;
    timestamp: Date;
}

const MessageSchema: Schema = new Schema({
    chatId: { type: String, required: true },
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
