import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyStep extends Document {
  user_id: string;
  dateKey: string; // YYYY-MM-DD
  steps: number;
  createdAt: Date;
  updatedAt: Date;
}

const DailyStepSchema = new Schema<IDailyStep>(
  {
    user_id: { type: String, required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    steps: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

DailyStepSchema.index({ user_id: 1, dateKey: 1 }, { unique: true });

const DailyStep = mongoose.models.DailyStep || mongoose.model<IDailyStep>('DailyStep', DailyStepSchema);

export default DailyStep;
