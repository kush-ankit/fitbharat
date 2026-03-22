import dotenv from 'dotenv';
dotenv.config();

// 1. Standard library and 3rd party imports
import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import os from 'os';

// 2. Local imports - Routes
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.route';
import chatRoutes from './routes/chat.route';
import roomRoutes from './routes/room.route';
import pathRoutes from './routes/path.route';
import groupRoutes from './routes/group.route';
import aiCheckinRoutes from './routes/aiCheckin.route';

// 3. Local imports - Controllers & Sockets
import { verifyToken } from './controllers/authController';
import socketManager from './sockets/socketManager';

// 4. Application Setup & Initialization
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Configure this appropriately for production
        methods: ['GET', 'POST']
    }
});

// 5. Database Connection
import dns from 'dns';
try {
    dns.setDefaultResultOrder('ipv4first');
    // Using Google DNS to avoid querySrv ECONNREFUSED on some networks
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.error('DNS configuration error:', e);
}

mongoose
    .connect(process.env.MONGO_URI || '')
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error('❌ MongoDB error:', err));

// 6. Middleware Configuration
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '*').split(',').map((x) => x.trim()).filter(Boolean);
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        },
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 7. REST API Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/chat', chatRoutes);
app.use('/room', roomRoutes);
app.use('/api/paths', pathRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/ai-checkin', aiCheckinRoutes);

// 8. Socket.io Authentication Middleware
const authMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication error: Token missing'));
    }

    try {
        const result = await verifyToken(token);
        if (result.success) {
            (socket as any).user = result.user;
            next();
        } else {
            return next(new Error(result.message));
        }
    } catch (err) {
        console.error("Auth Error:", err);
        next(new Error('Authentication error'));
    }
};

// 9. Real-time Namespaces
io.of("/location").use(authMiddleware);
io.of("/messages").use(authMiddleware);

// Initialize Socket.io Manager
socketManager(io);

// 10. Start Server
function getLocalIP(): string {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
        const ifaces = interfaces[name];
        if (!ifaces) continue;

        for (const iface of ifaces) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }

    return '127.0.0.1';
}
const PORT = process.env.PORT || 3000;

server.listen(Number(PORT), getLocalIP(), () => {
    console.log(`✅ Server is running on http://${getLocalIP()}:${PORT}`);
});
