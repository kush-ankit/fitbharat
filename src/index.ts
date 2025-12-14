import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import os from 'os';
import cookieParser from 'cookie-parser';

import apiRoutes from './routes/api';
import roomRoutes from './routes/room.route';
import pathRoutes from './routes/path.route';
import authRoutes from './routes/auth.route';
import chatRoutes from './routes/chat.route';
import userRoutes from './routes/user.route';
import groupRoutes from './routes/group.route';
import socketManager from './sockets/socketManager';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Configure this appropriately for production
        methods: ['GET', 'POST']
    }
});

const serverIP = (): string => {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        const netInterface = nets[name];
        if (netInterface) {
            for (const net of netInterface) {
                if (net.family === "IPv4" && !net.internal) {
                    return net.address;
                }
            }
        }
    }
    return "localhost";
};

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || '')
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error('❌ MongoDB error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/api', apiRoutes);
app.use('/room', roomRoutes);
app.use('/api/paths', pathRoutes);

app.use('/chat', chatRoutes);

app.use('/api/groups', groupRoutes);

// Socket.io Auth Middleware
io.use(async (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication error: Token missing'));
    }
    try {
        // Validate request by calling to server
        // NOTE: This assumes an external auth service is running
        const response = await fetch(`http://${serverIP()}:${process.env.PORT || 3000}/auth/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: token._j || token }), // Handle both formats just in case
        });

        if (!response.ok) {
            throw new Error('Token validation failed');
        }
        const { user } = await response.json();
        if (!user) {
            throw new Error('User not found in token validation response');
        }

        (socket as any).user = user;
        next();
    } catch (err) {
        console.error("Auth Error:", err);
        next(new Error('Authentication error'));
    }
});

// Socket.io Manager
socketManager(io);

const PORT = process.env.PORT || 3000;

server.listen(Number(PORT), serverIP(), () => {
    console.log(`Server running at http://${serverIP()}:${PORT}`);
});
