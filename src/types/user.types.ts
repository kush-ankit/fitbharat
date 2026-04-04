import { Document } from "mongoose";

export interface IUser extends Document {
    uid: string;           // Firebase UID — primary identifier
    email: string;
    displayName?: string;
    photoURL?: string;
    emailVerified: boolean;
    password?: string;
    chats?: string[];
    provider: string;      // 'google.com', 'password', etc.
    lastLoginAt: Date;
    createdAt: Date;
    updatedAt: Date;
    // App-specific fields
    role: 'user' | 'admin';
    isActive: boolean;
    xp: number;            // Experience / activity points for leaderboard
    height_cm?: number;
    weight_kg?: number;
    bmi?: number;
    diet?: 'veg' | 'nonveg';
}