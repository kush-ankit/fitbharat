import mongoose, { Schema, Document } from 'mongoose';

export interface IParticipant {
    userId: string;
    userName?: string;
    socketId?: string;
    latitude?: number;
    longitude?: number;
}

export interface IRoom extends Document {
    roomCode: string;
    roomName: string;
    adminId: string;
    pathId?: mongoose.Types.ObjectId | string;
    status: 'STARTING' | 'ACTIVE' | 'FINISHED';
    participants: IParticipant[];
    // Legacy fields kept optional for backwards compatibility
    name?: string;
    description?: string;
    route?: {
        type: 'LineString';
        coordinates: number[][];
    };
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ParticipantSchema: Schema = new Schema(
    {
        userId: { type: String, required: true },
        userName: { type: String },
        socketId: { type: String },
        latitude: { type: Number, default: 0 },
        longitude: { type: Number, default: 0 },
    },
    { _id: false }
);

const RoomSchema: Schema = new Schema(
    {
        roomCode: {
            type: String,
            required: true,
            unique: true,
            index: true,
            length: 6,
        },
        roomName: {
            type: String,
            required: true,
            trim: true,
        },
        adminId: {
            type: String,
            required: true,
        },
        pathId: {
            type: Schema.Types.ObjectId,
            ref: 'Path',
            required: false,
            index: true,
        },
        status: {
            type: String,
            enum: ['STARTING', 'ACTIVE', 'FINISHED'],
            default: 'STARTING',
            index: true,
        },
        participants: {
            type: [ParticipantSchema],
            default: [],
        },
        // Legacy fields for backwards compatibility
        name: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        route: {
            type: { type: String, enum: ["LineString"], default: "LineString" },
            coordinates: { type: [[Number]] }, // Array of [lng, lat]
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

RoomSchema.index({ pathId: 1, status: 1 });

const Room = mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);

export { Room };

