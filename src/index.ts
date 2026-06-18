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
import morgan from 'morgan';

// 2. Local imports - Routes
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.route';
import chatRoutes from './routes/chat.route';
import roomRoutes from './routes/room.route';
import pathRoutes from './routes/path.route';
import groupRoutes from './routes/group.route';
import aiCheckinRoutes from './routes/aiCheckin.route';

// 3. Local imports - Controllers & Sockets
import admin from './config/firebase';
import socketManager from './sockets/socketManager';
import logger from './utils/logger';

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
    logger.error('DNS configuration error:', e);
}

mongoose
    .connect(process.env.MONGO_URI || '')
    .then(() => logger.info('✅ MongoDB connected'))
    .catch((err) => logger.error(`❌ MongoDB error: ${err.message}`, err));

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

app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 7. REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/room', roomRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/paths', pathRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/ai-checkin', aiCheckinRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(err.stack || err.message);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
    });
});

// 8. Socket.io Authentication Middleware
const authMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
    // Support token from both handshake.auth (preferred) and handshake.query (React Native fallback)
    const token = socket.handshake.auth.token || (socket.handshake.query.token as string | undefined);
    logger.debug(`Socket Auth Token: ${token ? '[provided]' : '[missing]'}`);
    if (!token) {
        return next(new Error('Authentication error: Token missing'));
    }
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log("Decoded Token:", decodedToken);
        logger.debug("Decoded Token attached to socket user");
        (socket as any).user = decodedToken;
        next();
    } catch (err: any) {
        logger.error(`Socket Auth Error: ${err.code || err.message}`);
        if (err.code === 'auth/id-token-expired') {
            return next(new Error('Authentication error: Token expired'));
        }
        next(new Error('Authentication error: Invalid token'));
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
    logger.info(`✅ Server is running on http://${getLocalIP()}:${PORT}`);
});
