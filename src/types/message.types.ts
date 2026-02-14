export default interface IMessage extends Document {
    text_massage: string;
    sender_user_id: string;
    receiver_user_id: string;
    created_at: Date;
}