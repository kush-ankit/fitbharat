import { Request, Response } from 'express';
import { Room } from '../models/room.model';
import crypto from 'crypto';

// Helper function to generate a 6-digit room code
const generateRoomCode = (): string => {
    const randomCode = crypto.randomBytes(3).toString('hex');
    return parseInt(randomCode, 16).toString().slice(0, 6);
};

// Controller to create a new room
const createRoom = async (req: Request, res: Response) => {
    console.log("Creating room with body:", req.body);

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
        console.error("Error creating room:", error);
        res.status(500).json({ error: "Server error while creating room" });
    }
};

const getRoom = async (req: Request, res: Response) => {
    const { roomCode } = req.query;
    console.log("Fetching room with code:", roomCode);

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
        console.error("Error fetching room:", error);
        res.status(500).json({ error: "Server error while fetching room" });
    }
};

export { createRoom, getRoom };
