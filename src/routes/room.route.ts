import express from 'express';
import { createRoom, getRoom, getNearbyRooms } from '../controllers/room.controller';
import { verifyToken } from '../middlewares/verifyToken';

const router = express.Router();

router.use(verifyToken);

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
router.post('/create-room', createRoom);

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
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.get('/get-room', getRoom);

/**
 * @swagger
 * /rooms/nearby:
 *   get:
 *     summary: Retrieve active or starting running lobbies within a 5 km radius of user GPS location
 *     tags: [Room]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: string
 *         required: true
 *         description: User's latitude
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: string
 *         required: true
 *         description: User's longitude
 *     responses:
 *       200:
 *         description: List of nearby rooms retrieved successfully
 *       400:
 *         description: Latitude and longitude are required or invalid
 *       500:
 *         description: Server error
 */
router.get('/nearby', getNearbyRooms);

export default router;

