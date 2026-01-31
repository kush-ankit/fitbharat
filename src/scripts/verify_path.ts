import mongoose from 'mongoose';
import { Path } from '../models/path.model';

const testPath = async () => {
    // Basic mock of a path data
    const mockData = {
        pathName: "Test Path",
        description: "A description",
        startLocation: { type: "Point", coordinates: [0, 0] },
        endLocation: { type: "Point", coordinates: [1, 1] },
        route: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
        // New fields
        distance: "5km",
        unit: "km",
        time: "30m",
        pace: "6:00",
        calories: "300",
        locationName: "Test Loc",
        locationAddress: "123 Test St",
        rating: 5,
        center: {
            latitude: 0.5,
            longitude: 0.5,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1
        }
    };

    try {
        const path = new Path(mockData);
        // Validate explicitly using validate() since we aren't saving to a real DB
        await path.validate();
        console.log("Validation successful");
        // Check if new fields are present
        if (path.distance !== "5km") throw new Error("Distance field not set");
        console.log("New fields validated successfully");
    } catch (err) {
        console.error("Validation failed:", err);
        process.exit(1);
    }
    process.exit(0);
};

testPath();
