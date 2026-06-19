import express, { Request, Response } from 'express';
import Group from '../models/Group';
import logger from '../utils/logger';
import { verifyToken } from '../middlewares/verifyToken';

const router = express.Router();

router.use(verifyToken);



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
router.post('/create', async (req: Request, res: Response) => {
    try {
        const { name, description, image, isPrivate, pathid } = req.body;

        if (!name || !description) {
            return res.status(400).json({ message: 'Name and description are required.' });
        }

        const newGroup = new Group({
            name,
            description,
            image,
            isPrivate,
            members: [],
            pathid
        });

        const savedGroup = await newGroup.save();
        logger.info('savedGroup created', { groupId: savedGroup.id });

        res.status(201).json(savedGroup);
    } catch (err) {
        logger.error('Error creating group:', { error: err });
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
router.get('/getallbypathid', async (req: Request, res: Response) => {
    try {
        const { pathid } = req.query;

        if (!pathid) {
            return res.status(400).json({ message: 'Path ID is required.' });
        }

        const groups = await Group.find({ pathid });
        res.status(200).json(groups);
    } catch (err) {
        logger.error('Error fetching groups:', { error: err });
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
