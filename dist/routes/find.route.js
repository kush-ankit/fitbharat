"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   name: Find
 *   description: User search
 */
/**
 * @swagger
 * /find/search:
 *   get:
 *     summary: Search for users
 *     tags: [Find]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query (name or email)
 *     responses:
 *       200:
 *         description: List of users found
 *       400:
 *         description: Search query is required
 *       500:
 *         description: Server error
 */
router.get('/search', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
    }
    try {
        const users = await User_1.default.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        }).select('-password');
        res.json({ users });
    }
    catch (err) {
        console.error('User search error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
