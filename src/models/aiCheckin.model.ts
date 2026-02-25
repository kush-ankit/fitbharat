import mongoose, { Document, Schema } from 'mongoose';

export type AiCheckinStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface IAiCheckin extends Document {
  userId?: string;
  status: AiCheckinStatus;
  source: 'image-upload';
  imagePath: string;
  mimeType: string;
  fileSize: number;
  consentAccepted: boolean;
  disclaimerAccepted: boolean;
  modelProvider?: string;
  modelName?: string;
  rawModelOutput?: unknown;
  result?: unknown;
  recommendations?: {
    trainingFocus: string[];
    nutritionFocus: string[];
    recoveryFocus: string[];
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AiCheckinSchema = new Schema<IAiCheckin>(
  {
    userId: { type: String },
    status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued' },
    source: { type: String, enum: ['image-upload'], default: 'image-upload' },
    imagePath: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    consentAccepted: { type: Boolean, default: false },
    disclaimerAccepted: { type: Boolean, default: false },
    modelProvider: { type: String },
    modelName: { type: String },
    rawModelOutput: { type: Schema.Types.Mixed },
    result: { type: Schema.Types.Mixed },
    recommendations: {
      trainingFocus: { type: [String], default: [] },
      nutritionFocus: { type: [String], default: [] },
      recoveryFocus: { type: [String], default: [] },
    },
    error: { type: String },
  },
  { timestamps: true }
);

const AiCheckin = mongoose.models.AiCheckin || mongoose.model<IAiCheckin>('AiCheckin', AiCheckinSchema);

export default AiCheckin;
