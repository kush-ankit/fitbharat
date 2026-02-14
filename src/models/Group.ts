import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
    name: string;
    description: string;
    image?: string;
    isPrivate: boolean;
    members: mongoose.Types.ObjectId[];
    pathid?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const GroupSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        image: { type: String },
        isPrivate: { type: Boolean, default: false },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        pathid: { type: mongoose.Schema.Types.ObjectId },
    },
    { timestamps: true }
);

const Group = mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);
export default Group;
