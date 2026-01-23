import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { registerUser, loginUser, verifyToken } from '../controllers/authController';

const router = express.Router();

// validate request through token in cookies and response with user data
router.post('/validate', async (req: Request, res: Response) => {
    const token = req.body.token || req.cookies?.token;
    const result = await verifyToken(token);
    console.log("Token validation result:", result);
    if (result.success) {
        return res.status(200).json({ message: 'Token is valid', user: result.user });
    } else {
        return res.status(401).json({ message: result.message });
    }
});

router.post('/login', loginUser);

router.post('/register', registerUser);


export default router;
