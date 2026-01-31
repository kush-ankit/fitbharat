import { Request, Response } from 'express';
import { Path } from '../models/path.model';

const savePath = async (req: Request, res: Response) => {
    try {
        const { startLocation, endLocation, route, name, description, distance, unit, time, pace, calories, locationName, locationAddress, rating, center } = req.body;

        if (!startLocation || !endLocation || !route || !name) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newPath = new Path({
            startLocation: { type: "Point", coordinates: [startLocation.longitude, startLocation.latitude] },
            endLocation: { type: "Point", coordinates: [endLocation.longitude, endLocation.latitude] },
            route: { type: "LineString", coordinates: route.map((point: any) => [point.longitude, point.latitude]) },
            pathName: name,
            description: description || "This is a path description",
            distance, // Keep original string if needed
            totalDistance: typeof distance === 'number' ? distance : parseFloat(distance) || 0, // Ensure number
            unit,
            time,
            pace,
            calories,
            locationName,
            locationAddress,
            rating,
            center
        });

        await newPath.save();
        res.status(201).json({ message: "Path saved successfully", newPath });
    } catch (error) {
        console.error("Error saving path:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


const getNearbyPaths = async (req: Request, res: Response) => {
    console.log("Fetching nearby paths...");

    try {
        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: "Latitude and longitude are required" });
        }

        const userCoordinates = [parseFloat(longitude as string), parseFloat(latitude as string)];

        // Find paths where any part of the route is within 5km (5000 meters) of the user
        // Use MongoDB $near operator on startPoint (startLocation)
        // Note: $near requires a 2dsphere index (which we added to path.model.ts)
        const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5000; // default 5km

        const nearbyPaths = await Path.find({
            startLocation: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: userCoordinates
                    },
                    $maxDistance: radius
                }
            }
        });

        res.status(200).json({ message: "Nearby Paths Found", paths: nearbyPaths });
    } catch (error) {
        console.error("Error fetching nearby paths:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getPathById = async (req: Request, res: Response) => {
    console.log("Fetching path by ID...");

    try {
        const { pathId } = req.query;

        if (!pathId) {
            return res.status(400).json({ error: "Path ID is required" });
        }

        const path = await Path.findById(pathId);

        if (!path) {
            return res.status(404).json({ error: "Path not found" });
        }

        res.status(200).json({ message: "Path found", path });
    } catch (error) {
        console.error("Error fetching path by ID:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export { savePath, getNearbyPaths, getPathById };
