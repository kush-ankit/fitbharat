import { Server, Socket } from 'socket.io';
import RaceManager from '../services/RaceManager';

export default (io: Server, socket: Socket) => {

    socket.on('create_lobby', async ({ pathId, userId, username }) => {
        try {
            const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            await RaceManager.createLobby(roomId, pathId, userId, username, socket.id);
            socket.join(roomId);
            socket.emit('create_lobby', { roomId, pathId });
            console.log(`Lobby created: ${roomId} by ${username}`);
        } catch (e: any) {
            console.error(e);
            socket.emit('error', { message: e.message || 'Failed to create lobby' });
        }
    });

    socket.on('join_lobby', ({ roomId, userId, username }) => {
        try {
            const race = RaceManager.joinLobby(roomId, userId, username, socket.id);
            socket.join(roomId);
            io.to(roomId).emit('user_joined', { userId, username });

            // Send current participants to joiner? 
            // The client might need full state. For now, just user_joined.
            console.log(`User ${username} joined lobby ${roomId}`);
        } catch (e: any) {
            socket.emit('error', { message: e.message || 'Failed to join lobby' });
        }
    });

    socket.on('start_race', async ({ roomId }) => {
        try {
            // Validate host? RaceManager doesn't track host strictly permission-wise but we assume logic for now.
            const success = await RaceManager.startRace(roomId);
            if (success) {
                const race = RaceManager.getRace(roomId);
                const startTime = new Date(race?.startTime || Date.now()).toISOString();
                io.to(roomId).emit('race_started', { startTime });
                console.log(`Race started: ${roomId}`);
            }
        } catch (e: any) {
            socket.emit('error', { message: e.message });
        }
    });

    socket.on('update_location', async ({ roomId, userId, lat, lng, speed, heading }) => {
        try {
            const result = await RaceManager.updatePlayerLocation(roomId, userId, lat, lng, speed || 0);

            if (result) {
                // Determine if we should broadcast IMMEDIATELY or throttle?
                // The prompt says "Broadcast update_leaderboard to the room".
                // High frequency.
                // We'll broadcast every time for strict requirement, or throttle in real app.
                // Here: broadcast.

                const leaderboard = RaceManager.getLeaderboard(roomId);
                io.to(roomId).emit('update_leaderboard', { leaderboard });

                if (result.finished) {
                    io.to(roomId).emit('user_finished', {
                        userId: result.player.userId,
                        rank: result.player.rank || 0,
                        time: result.player.finishTime || 0
                    });

                    // Save individual result handled in Manager
                    await RaceManager.saveParticipantResult(roomId, userId);
                }
            }
        } catch (e) {
            // silent fail or log
            console.error(e);
        }
    });

    socket.on('disconnect', () => {
        // Handle disconnect? RaceManager doesn't remove player on disconnect immediately to allow reconnect?
        // Or remove from Active list?
        // For now, ignroe.
    });
};
