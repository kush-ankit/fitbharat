"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoom = exports.createRoom = void 0;
const room_model_1 = require("../models/room.model");
const crypto_1 = __importDefault(require("crypto"));
// Helper function to generate a 6-digit room code
const generateRoomCode = () => {
    const randomCode = crypto_1.default.randomBytes(3).toString('hex');
    return parseInt(randomCode, 16).toString().slice(0, 6);
};
// Controller to create a new room
const createRoom = async (req, res) => {
    console.log("Creating room with body:", req.body);
    try {
        const { name, description, coordinates } = req.body;
        if (!name || !description || !coordinates || coordinates.length === 0) {
            return res.status(400).json({ error: "Name, description, and coordinates are required" });
        }
        const roomCode = generateRoomCode();
        const newRoom = new room_model_1.Room({
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
    }
    catch (error) {
        console.error("Error creating room:", error);
        res.status(500).json({ error: "Server error while creating room" });
    }
};
exports.createRoom = createRoom;
const getRoom = async (req, res) => {
    const { roomCode } = req.query;
    console.log("Fetching room with code:", roomCode);
    if (!roomCode) {
        return res.status(400).json({ error: "Room code is required" });
    }
    try {
        const room = await room_model_1.Room.findOne({ roomCode });
        if (!room) {
            return res.status(404).json({ error: "Room not found" });
        }
        res.status(200).json({
            success: true,
            message: "Room fetched successfully",
            room,
        });
    }
    catch (error) {
        console.error("Error fetching room:", error);
        res.status(500).json({ error: "Server error while fetching room" });
    }
};
exports.getRoom = getRoom;
