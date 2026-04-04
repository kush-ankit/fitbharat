import { Server, Socket } from 'socket.io';
import socketHandler from './chatSocket';
import locationHandler from './locationHandler';
import logger from '../utils/logger';

export default (io: Server) => {

    const messagesIO = io.of('/messages');
    const locationIO = io.of('/location');

    locationIO.on('connection', (socket: Socket) => {
        logger.info(`🔌 Location Client connected: ${socket.id}`);
        logger.debug("Location Socket Data:", { data: socket.data });


        // Attach Location/Room Logic
        locationHandler(locationIO, socket);

        socket.on('disconnect', () => {
            logger.info(`❌ Location Client disconnected: ${socket.id}`);
        });
    });

    messagesIO.on('connection', (socket: Socket) => {
        logger.info(`🔌 Messages Client connected: ${socket.id}`);
        logger.debug("Message Socket Data:", { data: socket.data });

        // Attach Chat Logic
        socketHandler(messagesIO, socket);
        socket.on('disconnect', () => {
            logger.info(`❌ Messages Client disconnected: ${socket.id}`);
        });
    });
};

