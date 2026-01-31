import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    userId: string;
    title: string;
    message: string;
    type: string; // 'friend_request', 'race_invite', 'system'
    read: boolean;
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
    userId: { type: String, required: true, ref: 'User' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'system' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
