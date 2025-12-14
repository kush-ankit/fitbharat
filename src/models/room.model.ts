import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
    name: string;
    description: string;
    roomCode: string;
    route: {
        type: 'LineString';
        coordinates: number[][];
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const RoomSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },
        roomCode: {
            type: String,
            required: true,
            unique: true,
            length: 6,
        },
        route: {
            type: { type: String, enum: ["LineString"], default: "LineString" },
            coordinates: { type: [[Number]], required: true }, // Array of [lng, lat]
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const Room = mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);

export { Room };
