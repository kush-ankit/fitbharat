import mongoose, { Schema, Document } from 'mongoose';

export interface IFriendRequest extends Document {
    fromUser: string;
    toUser: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
}

const FriendRequestSchema: Schema = new Schema({
    fromUser: { type: String, required: true, ref: 'User' },
    toUser: { type: String, required: true, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Compound index to prevent duplicate requests
FriendRequestSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

export default mongoose.model<IFriendRequest>('FriendRequest', FriendRequestSchema);
