import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    sender_user_id: string;
    receiver_user_id: string;
    text_massage: string;
    created_at: Date;
}

const MessageSchema: Schema = new Schema({
    sender_user_id: { type: String, required: true },
    receiver_user_id: { type: String, required: true },
    text_massage: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
});

const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
