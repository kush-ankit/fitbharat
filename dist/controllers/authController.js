"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAllChats = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Chat_1 = __importDefault(require("../models/Chat"));
const registerUser = async (req, res) => {
    try {
        const { name, email, userid, password } = req.body;
        // Validate input
        if (!name || !email || !password || !userid) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }
        // Hash the password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create and save the new user
        const newUser = new User_1.default({ name, email, userid, password: hashedPassword });
        await newUser.save();
        return res.status(201).json({ message: 'User registered successfully' });
    }
    catch (error) {
        console.error('Register Error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        // Find the user by email
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Check password validity
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user._id, userId: user.userid, email: user.email }, process.env.JWT_SECRET);
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userid: user.userid,
            },
        });
    }
    catch (error) {
        console.error('Login Error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.loginUser = loginUser;
const findAllChats = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token || !process.env.JWT_SECRET) {
            return res.status(401).json({ message: 'Missing or invalid token' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);
        const user = await User_1.default.findOne({ userid: decoded.userId });
        console.log('user:', user);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const chats = await Chat_1.default.find({ chatid: { $in: user.chats } });
        console.log('chats:', chats);
        return res.status(200).json({ chats });
    }
    catch (error) {
        console.error('Error in /getAllChats:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.findAllChats = findAllChats;
