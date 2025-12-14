import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Chat from '../models/Chat';

const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, userid, password } = req.body;

        // Validate input
        if (!name || !email || !password || !userid) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the new user
        const newUser = new User({ name, email, userid, password: hashedPassword });
        await newUser.save();
        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error: any) {
        console.error('Register Error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        console.log("email", email);
        console.log("password", password);


        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check password validity
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, userId: user.userid, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' } // Token expires in 1 day
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            sameSite: 'strict'
        });

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
    } catch (error: any) {
        console.error('Login Error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const findAllChats = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token || !process.env.JWT_SECRET) {
            return res.status(401).json({ message: 'Missing or invalid token' });
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

        console.log('Decoded token:', decoded);

        const user = await User.findOne({ userid: decoded.userId });

        console.log('user:', user);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const chats = await Chat.find({ chatid: { $in: user.chats } });
        console.log('chats:', chats);

        return res.status(200).json({ chats });

    } catch (error) {
        console.error('Error in /getAllChats:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

export { registerUser, loginUser, findAllChats };
