"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chatSocket_1 = __importDefault(require("./chatSocket"));
const locationHandler_1 = __importDefault(require("./locationHandler"));
exports.default = (io) => {
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);
        // Attach Chat Logic
        (0, chatSocket_1.default)(io, socket);
        // Attach Location/Room Logic
        (0, locationHandler_1.default)(io, socket);
        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });
};
