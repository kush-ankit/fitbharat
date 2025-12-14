import express from 'express';
import { createRoom, getRoom } from '../controllers/room.controller';

const router = express.Router();

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
 *       400:
 *         description: Room code is required
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.get('/get-room', getRoom);

export default router;

