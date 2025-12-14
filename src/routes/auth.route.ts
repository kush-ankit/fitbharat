import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { registerUser, loginUser, findAllChats } from '../controllers/authController';

const router = express.Router();

// validate request through token in cookies and response with user data
router.post('/validate', async (req: Request, res: Response) => {
    try {
        const token = req.body.token || req.cookies?.token;

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Unauthorized: User not found' });
        }

        return res.status(200).json({ message: 'Token is valid', user });
    } catch (error: any) {
        console.error('Token validation error:', error.message);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token has expired' });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }

        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/login', loginUser);

router.post('/register', registerUser);

router.get('/getAllChats', findAllChats);

export default router;
