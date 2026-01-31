import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Chat from '../models/Chat';
import IUser from '../types/user.types';

const registerUser = async (req: Request, res: Response) => {
    try {
        const { user_name, user_email, user_id, user_password }: IUser = req.body;

        // Validate input
        if (!user_name || !user_email || !user_password || !user_id) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ user_email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(user_password, 10);

        // Create and save the new user
        const newUser = new User({ user_name, user_email, user_id, user_password: hashedPassword });
        await newUser.save();
        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error: any) {
        console.error('Register Error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const loginUser = async (req: Request, res: Response) => {
    try {
        const { user_email, user_password } = req.body;

        console.log("email", user_email);
        console.log("password", user_password);


        // Validate input
        if (!user_email || !user_password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find the user by email
        const user = await User.findOne({ user_email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check password validity
        const isMatch = await bcrypt.compare(user_password, user.user_password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { user_id: user.user_id, user_email: user.user_email },
            process.env.JWT_SECRET as string,
            { expiresIn: '30d' } // Token expires in 30 days
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            sameSite: 'strict'
        });

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: user,
        });

    } catch (error: any) {
        console.error('Login Error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const verifyToken = async (token: string) => {
    try {
        if (!token) {
            return { success: false, message: 'Unauthorized: No token provided' };
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
        const user = await User.findOne({ user_id: decoded.user_id }).select('-password');

        if (!user) {
            return { success: false, message: 'Unauthorized: User not found' };
        }

        return { success: true, message: 'Token is valid', user };
    } catch (error: any) {
        console.error('Token validation error:', error.message);

        if (error.name === 'TokenExpiredError') {
            return { success: false, message: 'Unauthorized: Token has expired' };
        }

        if (error.name === 'JsonWebTokenError') {
            return { success: false, message: 'Unauthorized: Invalid token' };
        }

        return { success: false, message: 'Internal Server Error' };
    }
};

export { registerUser, loginUser, verifyToken };
