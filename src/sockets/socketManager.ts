import { Server, Socket } from 'socket.io';
import socketHandler from './chatSocket';
import locationHandler from './locationHandler';

export default (io: Server) => {

    const messagesIO = io.of('/messages');
    const locationIO = io.of('/location');

    locationIO.on('connection', (socket: Socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Attach Location/Room Logic
        locationHandler(locationIO, socket);

        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });

    messagesIO.on('connection', (socket: Socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Attach Chat Logic
        socketHandler(messagesIO, socket);
        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });
};

