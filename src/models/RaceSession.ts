import mongoose, { Schema, Document } from 'mongoose';

export interface IRaceParticipant {
    userId: string; // or ObjectId
    rank: number;
    time: number; // in seconds or ms
    username: string; // snapshot for history
}

export interface IRaceSession extends Document {
    pathId: mongoose.Types.ObjectId;
    participants: IRaceParticipant[];
    startTime: Date;
    endTime: Date;
    createdAt: Date;
    updatedAt: Date;
}

const RaceSessionSchema: Schema = new Schema(
    {
        pathId: {
            type: Schema.Types.ObjectId,
            ref: 'Path',
            required: true,
        },
        participants: [
            {
                userId: { type: String, required: true }, // Using String matching User schema user_id
                rank: { type: Number, required: true },
                time: { type: Number, required: true },
                username: { type: String, required: true },
            },
        ],
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

const RaceSession = mongoose.models.RaceSession || mongoose.model<IRaceSession>('RaceSession', RaceSessionSchema);

export default RaceSession;
