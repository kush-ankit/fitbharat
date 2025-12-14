"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management
 */
/**
 * @swagger
 * /auth/validate:
 *   post:
 *     summary: Validate JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Unauthorized
 */
// validate request through token in cookies and response with user data
router.post('/validate', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        const user = await User_1.default.findById(decoded.id).select('-password');
        console.log(user);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: User not found' });
        }
        res.status(200).json({ message: 'Token is valid', user });
    }
    catch (error) {
        console.error('Token validation error:', error);
        res.status(401).json({ message: 'Error while authentication' });
    }
});
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */
router.post('/login', authController_1.loginUser);
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               userid:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing fields
 *       409:
 *         description: User already exists
 */
router.post('/register', authController_1.registerUser);
/**
 * @swagger
 * /auth/getAllChats:
 *   get:
 *     summary: Get all chats for the authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chats
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/getAllChats', authController_1.findAllChats);
exports.default = router;
