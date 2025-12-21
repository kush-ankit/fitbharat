import { Server, Socket } from 'socket.io';
import socketHandler from './chatSocket';
import locationHandler from './locationHandler';

export default (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Attach Chat Logic
        socketHandler(io, socket);

        // Attach Location/Room Logic
        locationHandler(io, socket);

        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });
};

