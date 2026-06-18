import { Request, Response } from 'express';
import { Room } from '../models/room.model';
import { Path } from '../models/path.model';
import crypto from 'crypto';
import logger from '../utils/logger';

// Helper function to generate a 6-digit room code
const generateRoomCode = (): string => {
    const randomCode = crypto.randomBytes(3).toString('hex');
    return parseInt(randomCode, 16).toString().slice(0, 6);
};

// Controller to create a new room
const createRoom = async (req: Request, res: Response) => {
    logger.debug("Creating room", { body: req.body });

    try {
        const { name, description, coordinates } = req.body;

        if (!name || !description || !coordinates || coordinates.length === 0) {
            return res.status(400).json({ error: "Name, description, and coordinates are required" });
        }

        const roomCode = generateRoomCode();

        const newRoom = new Room({
            name,
            description,
            roomCode,
            roomName: name, // support new schema
            adminId: "legacy-admin", // support new schema for compatibility
            status: "STARTING", // support new schema
            route: {
                type: "LineString",
                coordinates: coordinates,
            },
        });


        await newRoom.save();

        res.status(201).json({
            success: true,
            message: "Room created successfully",
            room: newRoom,
        });
    } catch (error) {
        logger.error("Error creating room:", { error });
        res.status(500).json({ error: "Server error while creating room" });
    }
};

const getRoom = async (req: Request, res: Response) => {
    const { roomCode } = req.query;
    logger.debug("Fetching room", { roomCode });

    if (!roomCode) {
        return res.status(400).json({ error: "Room code is required" });
    }

    try {
        const room = await Room.findOne({ roomCode });

        if (!room) {
            return res.status(404).json({ error: "Room not found" });
        }

        res.status(200).json({
            success: true,
            message: "Room fetched successfully",
            room,
        });
    } catch (error) {
        logger.error("Error fetching room:", { error });
        res.status(500).json({ error: "Server error while fetching room" });
    }
};

// Controller to get active or starting rooms within a 5 km radius of current GPS coordinates
const getNearbyRooms = async (req: Request, res: Response) => {
    logger.debug("Fetching nearby rooms...");

    try {
        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: "Latitude and longitude are required" });
        }

        const latVal = parseFloat(latitude as string);
        const lngVal = parseFloat(longitude as string);

        if (isNaN(latVal) || isNaN(lngVal)) {
            return res.status(400).json({ error: "Latitude and longitude must be valid numbers" });
        }

        const userCoordinates = [lngVal, latVal]; // GeoJSON format: [longitude, latitude]

        // Find paths whose startLocation is within 5km of the user
        const nearbyPaths = await Path.find({
            startLocation: {
                $geoWithin: {
                    $centerSphere: [userCoordinates, 5 / 6378.1], // Convert 5 km radius to radians
                },
            },
        });

        const pathIds = nearbyPaths.map((path) => path._id);

        // Find rooms with STARTING or ACTIVE status associated with these paths
        const nearbyRooms = await Room.find({
            pathId: { $in: pathIds },
            status: { $in: ['STARTING', 'ACTIVE'] },
        }).populate('pathId');

        res.status(200).json({
            success: true,
            message: "Nearby Rooms Found",
            rooms: nearbyRooms,
        });
    } catch (error) {
        logger.error("Error fetching nearby rooms:", { error });
        res.status(500).json({ error: "Internal server error" });
    }
};

export { createRoom, getRoom, getNearbyRooms };
