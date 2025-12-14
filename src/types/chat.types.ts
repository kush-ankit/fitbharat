export default interface IChat {
    _id: string;
    chatId: string;
    chat_members_user_id: string[];
    createdAt: Date;
}