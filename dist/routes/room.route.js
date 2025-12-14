"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const room_controller_1 = require("../controllers/room.controller");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   name: Room
 *   description: Room management
 */
/**
 * @swagger
 * /room/create-room:
 *   post:
 *     summary: Create a new room
 *     tags: [Room]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               coordinates:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: number
 *     responses:
 *       201:
 *         description: Room created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/create-room', room_controller_1.createRoom);
/**
 * @swagger
 * /room/get-room:
 *   get:
 *     summary: Get room details by room code
 *     tags: [Room]
 *     parameters:
 *       - in: query
 *         name: roomCode
 *         schema:
 *           type: string
 *         required: true
 *         description: The room code
 *     responses:
 *       200:
 *         description: Room details
 *       400:
 *         description: Room code is required
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.get('/get-room', room_controller_1.getRoom);
exports.default = router;
