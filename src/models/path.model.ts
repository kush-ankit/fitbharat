import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation {
    type: string;
    coordinates: [number, number];
}

export interface IRoute {
    type: string;
    coordinates: [number, number][];
}

export interface IPath extends Document {
    pathName: string;
    description: string;
    startLocation: ILocation;
    endLocation: ILocation;
    route: IRoute;
    // Optional/Mock fields for UI
    totalDistance: number; // In meters
    distance?: string;
    unit?: string;
    time?: string;
    pace?: string;
    calories?: string;
    locationName?: string;
    locationAddress?: string;
    rating?: number;
    center?: { latitude: number; longitude: number; latitudeDelta?: number; longitudeDelta?: number };
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
        distance: { type: String },
        totalDistance: { type: Number, required: true, default: 0 },
        unit: { type: String },
        time: { type: String },
        pace: { type: String },
        calories: { type: String },
        locationName: { type: String },
        locationAddress: { type: String },
        rating: { type: Number },
        center: {
            latitude: { type: Number },
            longitude: { type: Number },
            latitudeDelta: { type: Number },
            longitudeDelta: { type: Number }
        }
    },
    { timestamps: true }
);

// Create 2dsphere index for geospatial queries
PathSchema.index({ startLocation: "2dsphere" });
PathSchema.index({ route: "2dsphere" });

const Path = mongoose.models.Path || mongoose.model<IPath>("Path", PathSchema);

export { Path };
