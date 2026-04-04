import { Schema, model, Document } from 'mongoose';
import { IUser } from '../types/user.types';



const UserSchema = new Schema<IUser>(
    {
        uid: { type: String, required: true, unique: true, index: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        displayName: { type: String, trim: true },
        photoURL: { type: String },
        emailVerified: { type: Boolean, default: false },
        password: { type: String },
        chats: [{ type: String }],
        provider: { type: String, required: true },
        lastLoginAt: { type: Date, default: Date.now },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        isActive: { type: Boolean, default: true },
        xp: { type: Number, default: 0, min: 0 },
        height_cm: { type: Number, min: 50, max: 300 },
        weight_kg: { type: Number, min: 10, max: 500 },
        bmi: { type: Number },
        diet: { type: String, enum: ['veg', 'nonveg'] },
    },
    {
        timestamps: true, // adds createdAt + updatedAt automatically
    }
);

export const User = model<IUser>('User', UserSchema);