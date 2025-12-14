import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    userid: string;
    email: string;
    password: string;
    chats: string[];
}

const UserSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    userid: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    chats: {
        type: [String], // Array of chat IDs
        default: [],
    },
});

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
