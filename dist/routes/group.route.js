"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Group_1 = __importDefault(require("../models/Group"));
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   name: Group
 *   description: Group management
 */
/**
 * @swagger
 * /api/groups/create:
 *   post:
 *     summary: Create a new group
 *     tags: [Group]
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
 *               image:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *               pathid:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group created successfully
 *       400:
 *         description: Name and description are required
 *       500:
 *         description: Server error
 */
// POST /api/groups
router.post('/create', async (req, res) => {
    try {
        const { name, description, image, isPrivate, pathid } = req.body;
        if (!name || !description) {
            return res.status(400).json({ message: 'Name and description are required.' });
        }
        const newGroup = new Group_1.default({
            name,
            description,
            image,
            isPrivate,
            members: [],
            pathid
        });
        const savedGroup = await newGroup.save();
        console.log('savedGroup:', savedGroup);
        res.status(201).json(savedGroup);
    }
    catch (err) {
        console.error('Error creating group:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
/**
 * @swagger
 * /api/groups/getallbypathid:
 *   get:
 *     summary: Get all groups by path ID
 *     tags: [Group]
 *     parameters:
 *       - in: query
 *         name: pathid
 *         schema:
 *           type: string
 *         required: true
 *         description: The path ID
 *     responses:
 *       200:
 *         description: List of groups
 *       400:
 *         description: Path ID is required
 *       500:
 *         description: Server error
 */
router.get('/getallbypathid', async (req, res) => {
    try {
        const { pathid } = req.query;
        if (!pathid) {
            return res.status(400).json({ message: 'Path ID is required.' });
        }
        const groups = await Group_1.default.find({ pathid });
        res.status(200).json(groups);
    }
    catch (err) {
        console.error('Error fetching groups:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
