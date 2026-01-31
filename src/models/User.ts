import mongoose, { Schema, Document } from 'mongoose';
import IUser from '../types/user.types';

const UserSchema: Schema = new Schema({
    user_id: {
        type: String,
        required: true,
        unique: true,
    },
    user_name: {
        type: String,
        required: true,
    },
    user_email: {
        type: String,
        required: true,
        unique: true,
    },
    user_password: {
        type: String,
        required: true,
    },
    user_chats: {
        type: [String], // Array of chat IDs
        default: [],
    },
    stats: {
        totalDistance: { type: Number, default: 0 },
        racesWon: { type: Number, default: 0 },
    },
    bio: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    weight: { type: Number, default: 0 },
    pushToken: { type: String, default: '' }, // Expo Push Token
    friends: {
        type: [String], // Array of user_ids
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
