export default interface IUser {
    _id: string;
    user_name: string;
    user_email: string;
    user_password: string;
    user_chats: string[];
    createdAt: Date;
    updatedAt: Date;
}