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

MessageSchema.index({ sender_user_id: 1, receiver_user_id: 1, created_at: -1 });
MessageSchema.index({ receiver_user_id: 1, sender_user_id: 1, created_at: -1 });

const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
