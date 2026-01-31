import { Server, Socket } from 'socket.io';

interface UserLocation {
    socketId: string;
    userId: string;
    latitude: number;
    longitude: number;
}

interface RoomData {
    [userId: string]: UserLocation;
}


const rooms: { [roomCode: string]: RoomData } = {}; // In-memory storage for room users and locations

export default (io: Server, socket: Socket) => {
    console.log("🟢 Location Handler: User connected:", socket.id);

    socket.on("join-room", ({ roomCode }: { roomCode: string; }) => {
        // Use authenticated user ID if available, otherwise fallback to payload (or enforce auth)
        const authenticatedUser = (socket as any).user;
        if (!authenticatedUser) return socket.emit('error', { message: 'Unauthorized' });
        const finalUserId = authenticatedUser.user_id;

        console.log(`User ${finalUserId} joined room ${roomCode}`);

        socket.join(roomCode);

        if (!rooms[roomCode]) {
            rooms[roomCode] = {};
        }

        rooms[roomCode][finalUserId] = {
            socketId: socket.id,
            userId: finalUserId,
            latitude: 0,
            longitude: 0,
        };

        io.to(roomCode).emit("room-users", Object.values(rooms[roomCode]));
    });

    socket.on("update-location", ({ roomCode, userId, latitude, longitude }: { roomCode: string; userId: string; latitude: number; longitude: number }) => {
        if (rooms[roomCode] && rooms[roomCode][userId]) {
            rooms[roomCode][userId].latitude = latitude;
            rooms[roomCode][userId].longitude = longitude;

            io.to(roomCode).emit("room-users", Object.values(rooms[roomCode]));
        }
    });

    socket.on('disconnect', () => {
        // console.log('🔴 Location Handler: User disconnected:', socket.id);

        for (const roomCode in rooms) {
            const usersInRoom = rooms[roomCode];
            for (const userId in usersInRoom) {
                if (usersInRoom[userId].socketId === socket.id) {
                    delete usersInRoom[userId];
                    console.log(`Removed user ${userId} from room ${roomCode}`);

                    // Update room members
                    io.to(roomCode).emit("room-users", Object.values(usersInRoom));

                    // If no users left, optionally delete the room
                    if (Object.keys(usersInRoom).length === 0) {
                        delete rooms[roomCode];
                        console.log(`Deleted empty room ${roomCode}`);
                    }
                    break;
                }
            }
        }
    });
};
