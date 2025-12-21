import { Document } from "mongoose";

export default interface IChat extends Document {
    chat_id: string;
    chat_members_user_id: string[];
    createdAt: Date;
}