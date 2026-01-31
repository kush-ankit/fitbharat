import { Document } from "mongoose";

export default interface IUser extends Document {
    user_id: string;
    user_name: string;
    user_email: string;
    user_password: string;
    user_chats: string[];
    stats: {
        totalDistance: number;
        racesWon: number;
    };
    bio: string;
    avatarUrl: string;
    weight: number;
    pushToken: string;
    friends: string[];
    createdAt: Date;
    updatedAt: Date;
}