import mongoose, { Schema, Document } from 'mongoose';

export interface IPath extends Document {
    startLocation: {
        type: 'Point';
        coordinates: number[];
    };
    endLocation: {
        type: 'Point';
        coordinates: number[];
    };
    route: {
        type: 'LineString';
        coordinates: number[][];
    };
    pathName: string;
    description?: string;
    location?: string;
    distance?: string;
    rating?: number;
    tags?: string[];
    image?: { uri: string };
    createdAt: Date;
    updatedAt: Date;
}


const PathSchema: Schema = new Schema(
    {
        startLocation: {
            type: { type: String, enum: ["Point"], default: "Point" },
            coordinates: { type: [Number], required: true }, // [longitude, latitude]
        },
        endLocation: {
            type: { type: String, enum: ["Point"], default: "Point" },
            coordinates: { type: [Number], required: true },
        },
        route: {
            type: { type: String, enum: ["LineString"], default: "LineString" },
            coordinates: { type: [[Number]], required: true }, // Array of [lng, lat]
        },
        pathName: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: false,
        },
        location: {
            type: String,
            required: false,
        },
        distance: {
            type: String,
            required: false,
        },
        rating: {
            type: Number,
            required: false,
        },
        tags: {
            type: [String],
            default: [],
        },
        image: {
            uri: { type: String, required: false },
        },
    },
    { timestamps: true }
);

// Create 2dsphere index for geospatial queries
PathSchema.index({ startLocation: "2dsphere" });
PathSchema.index({ route: "2dsphere" });

const Path = mongoose.models.Path || mongoose.model<IPath>("Path", PathSchema);

export { Path };
