"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNearbyPaths = exports.savePath = void 0;
const path_model_1 = require("../models/path.model");
const savePath = async (req, res) => {
    try {
        const { startLocation, endLocation, route, name, description } = req.body;
        if (!startLocation || !endLocation || !route || !name) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const newPath = new path_model_1.Path({
            startLocation: { type: "Point", coordinates: [startLocation.longitude, startLocation.latitude] },
            endLocation: { type: "Point", coordinates: [endLocation.longitude, endLocation.latitude] },
            route: { type: "LineString", coordinates: route.map((point) => [point.longitude, point.latitude]) },
            pathName: name,
            description: description || "This is a path description",
        });
        await newPath.save();
        res.status(201).json({ message: "Path saved successfully", newPath });
    }
    catch (error) {
        console.error("Error saving path:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.savePath = savePath;
const getNearbyPaths = async (req, res) => {
    console.log("Fetching nearby paths...");
    try {
        const { latitude, longitude } = req.query;
        if (!latitude || !longitude) {
            return res.status(400).json({ error: "Latitude and longitude are required" });
        }
        const userCoordinates = [parseFloat(longitude), parseFloat(latitude)];
        // Find paths where any part of the route is within 5km (5000 meters) of the user
        const nearbyPaths = await path_model_1.Path.find({
            route: {
                $geoWithin: {
                    $centerSphere: [userCoordinates, 5 / 6378.1], // Convert 5 km to radians
                },
            },
        });
        res.status(200).json({ message: "Nearby Paths Found", paths: nearbyPaths });
    }
    catch (error) {
        console.error("Error fetching nearby paths:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getNearbyPaths = getNearbyPaths;
