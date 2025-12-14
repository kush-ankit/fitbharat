"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const os_1 = __importDefault(require("os"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const api_1 = __importDefault(require("./routes/api"));
const room_route_1 = __importDefault(require("./routes/room.route"));
const path_route_1 = __importDefault(require("./routes/path.route"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const chat_route_1 = __importDefault(require("./routes/chat.route"));
const find_route_1 = __importDefault(require("./routes/find.route"));
const group_route_1 = __importDefault(require("./routes/group.route"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = __importDefault(require("./config/swagger"));
const socketManager_1 = __importDefault(require("./sockets/socketManager"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*', // Configure this appropriately for production
        methods: ['GET', 'POST']
    }
});
const serverIP = () => {
    const nets = os_1.default.networkInterfaces();
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
mongoose_1.default.connect(process.env.MONGO_URI || '')
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error('❌ MongoDB error:', err));
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api', api_1.default);
app.use('/room', room_route_1.default);
app.use('/api/paths', path_route_1.default);
app.use('/auth', auth_route_1.default);
app.use('/chat', chat_route_1.default);
app.use('/find', find_route_1.default);
app.use('/api/groups', group_route_1.default);
// Swagger UI
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
// Socket.io Auth Middleware
io.use(async (socket, next) => {
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
        socket.user = user;
        next();
    }
    catch (err) {
        console.error("Auth Error:", err);
        next(new Error('Authentication error'));
    }
});
// Socket.io Manager
(0, socketManager_1.default)(io);
const PORT = process.env.PORT || 3000;
server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running at http://${serverIP()}:${PORT}`);
});
