export default interface IMessage {
    _id: string;
    chatId: string;
    sender: string;
    receiver: string;
    text: string;
    createdAt: Date;
}