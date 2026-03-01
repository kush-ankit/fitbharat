import { Request, Response } from 'express';
import { Path } from '../models/path.model';

const savePath = async (req: Request, res: Response) => {
    try {
        const { startLocation, endLocation, route, name, description, location, distance, rating, tags, image } = req.body;

        if (!startLocation || !endLocation || !route || !name) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newPath = new Path({
            startLocation: { type: "Point", coordinates: [startLocation.longitude, startLocation.latitude] },
            endLocation: { type: "Point", coordinates: [endLocation.longitude, endLocation.latitude] },
            route: { type: "LineString", coordinates: route.map((point: any) => [point.longitude, point.latitude]) },
            pathName: name,
            description: description || "This is a path description",
            location: location || "Unknown Location",
            distance: distance || "0.0",
            rating: rating ?? 4.5,
            tags: tags || [],
            image: image || { uri: "" },
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
        const nearbyPaths = await Path.find({
            route: {
                $geoWithin: {
                    $centerSphere: [userCoordinates, 5 / 6378.1], // Convert 5 km to radians
                },
            },
        });

        const formattedPaths = nearbyPaths.map((path) => ({
            id: path._id,
            name: path.pathName,
            location: path.location || path.description || 'Unknown Location',
            distance: path.distance || '0.0',
            rating: path.rating ?? 4.5,
            tags: path.tags || [],
            image: path.image || { uri: '' },
            description: path.description,
            startLocation: {
                latitude: path.startLocation.coordinates[1],
                longitude: path.startLocation.coordinates[0],
            },
            endLocation: {
                latitude: path.endLocation.coordinates[1],
                longitude: path.endLocation.coordinates[0],
            },
            route: path.route.coordinates.map((coord: number[]) => ({
                latitude: coord[1],
                longitude: coord[0],
            })),
            createdAt: path.createdAt,
            updatedAt: path.updatedAt,
        }));

        res.status(200).json({ message: "Nearby Paths Found", paths: formattedPaths });
    } catch (error) {
        console.error("Error fetching nearby paths:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getPathById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "Path ID is required" });
        }

        const path = await Path.findById(id);

        if (!path) {
            return res.status(404).json({ error: "Path not found" });
        }

        res.status(200).json({
            message: "Path fetched successfully",
            path: {
                id: path._id,
                name: path.pathName,
                location: path.location || path.description || 'Unknown Location',
                distance: path.distance || '0.0',
                rating: path.rating ?? 4.5,
                tags: path.tags || [],
                image: path.image || { uri: '' },
                pathName: path.pathName,
                description: path.description,
                startLocation: {
                    latitude: path.startLocation.coordinates[1],
                    longitude: path.startLocation.coordinates[0],
                },
                endLocation: {
                    latitude: path.endLocation.coordinates[1],
                    longitude: path.endLocation.coordinates[0],
                },
                route: path.route.coordinates.map((coord: number[]) => ({
                    latitude: coord[1],
                    longitude: coord[0],
                })),
                createdAt: path.createdAt,
                updatedAt: path.updatedAt,
            },
        });
    } catch (error) {
        console.error("Error fetching path by ID:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export { savePath, getNearbyPaths, getPathById };
