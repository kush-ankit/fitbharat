import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
    userId: string;
    pathId?: string; // Optional, if linked to a known path
    distance: number; // meters
    duration: number; // seconds
    calories: number;
    routePolyline?: string; // Encoded polyline string
    startTime: Date;
    endTime: Date;
    createdAt: Date;
}

const ActivitySchema: Schema = new Schema({
    userId: { type: String, required: true, ref: 'User' }, // referencing User.user_id
    pathId: { type: String, required: false, ref: 'Path' },
    distance: { type: Number, required: true },
    duration: { type: Number, required: true },
    calories: { type: Number, default: 0 },
    routePolyline: { type: String, default: '' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IActivity>('Activity', ActivitySchema);
