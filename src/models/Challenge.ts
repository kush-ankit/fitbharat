import mongoose, { Schema, Document } from 'mongoose';

export interface IChallenge extends Document {
    title: string;
    description: string;
    goal: number; // e.g., 50km
    type: 'distance' | 'time' | 'runs';
    startDate: Date;
    endDate: Date;
    participants: string[]; // user_ids
    createdAt: Date;
}

const ChallengeSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    goal: { type: Number, required: true },
    type: { type: String, enum: ['distance', 'time', 'runs'], default: 'distance' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    participants: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IChallenge>('Challenge', ChallengeSchema);
