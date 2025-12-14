"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_controller_1 = require("../controllers/path.controller");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   name: Path
 *   description: Path management
 */
/**
 * @swagger
 * /api/paths/save-path:
 *   post:
 *     summary: Save a new path
 *     tags: [Path]
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
 *               startLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               endLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               route:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *     responses:
 *       201:
 *         description: Path saved successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/save-path', path_controller_1.savePath);
/**
 * @swagger
 * /api/paths/nearby-paths:
 *   get:
 *     summary: Get nearby paths
 *     tags: [Path]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         required: true
 *         description: User's latitude
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         required: true
 *         description: User's longitude
 *     responses:
 *       200:
 *         description: List of nearby paths
 *       400:
 *         description: Latitude and longitude are required
 *       500:
 *         description: Server error
 */
router.get('/nearby-paths', path_controller_1.getNearbyPaths);
exports.default = router;
