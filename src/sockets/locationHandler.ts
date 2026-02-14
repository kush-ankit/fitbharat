import { Namespace, Server, Socket } from 'socket.io';
import { Path } from '../models/path.model';

interface UserLocation {
    socketId: string;
    userId: string;
    userName: string;
    latitude: number;
    longitude: number;
}

interface RoomData {
    participants: { [userId: string]: UserLocation };
    adminId: string;
    roomName: string;
    pathId?: string;
}

const rooms: { [roomCode: string]: RoomData } = {}; // In-memory storage for room users and locations

export default (locationIO: Namespace, socket: Socket) => {
    console.log("🟢 Location Handler: User connected:", socket.id);


    socket.on("create-run", ({ roomCode, roomName, pathId }: { roomCode: string, roomName: string, pathId?: string }) => {
        // Use authenticated user ID if available
        const authenticatedUser = (socket as any).user;

        if (!authenticatedUser) {
            socket.emit("error", { message: "Authentication required to create a run." });
            return;
        }

        const userId = authenticatedUser.user_id;
        // Ensure uniqueness (simple retry logic)
        if (rooms[roomCode]) {
            socket.emit("error", { message: "Room already exists." });
            return;
        }

        rooms[roomCode] = {
            participants: {},
            adminId: userId,
            roomName: roomName,
            pathId: pathId,
        };

        rooms[roomCode].participants[userId] = {
            socketId: socket.id,
            userId: userId,
            userName: authenticatedUser.user_name,
            latitude: 0,
            longitude: 0,
        };

        socket.join(roomCode);
        console.log(`User ${userId} created and joined room ${roomCode} as admin`);

        // Emit back the room details to the creator
        socket.emit("run-created", {
            roomCode,
            roomName,
            adminId: userId,
            participants: Object.values(rooms[roomCode].participants)
        });
    });

    socket.on("join-run", ({ roomCode }: { roomCode: string; userId: string }) => {
        // Use authenticated user ID if available, otherwise fallback to payload (or enforce auth)
        const authenticatedUser = (socket as any).user;
        const userId = authenticatedUser.user_id;

        if (!authenticatedUser) {
            socket.emit("error", { message: "Authentication required to join a run." });
            return;
        }

        if (!rooms[roomCode]) {
            socket.emit("error", { message: "Room does not exist." });
            return;
        }

        console.log(`User ${userId} joined room ${roomCode}`);
        socket.join(roomCode);

        rooms[roomCode].participants[userId] = {
            socketId: socket.id,
            userName: authenticatedUser.user_name,
            userId: userId,
            latitude: 0,
            longitude: 0,
        };

        locationIO.to(roomCode).emit("room-users", {
            roomCode,
            roomName: rooms[roomCode].roomName,
            adminId: rooms[roomCode].adminId,
            participants: Object.values(rooms[roomCode].participants)
        });
    });

    socket.on("start-run", async ({ roomCode }: { roomCode: string }) => {
        if (rooms[roomCode]) {
            locationIO.to(roomCode).emit("run-started", {
                roomCode,
                roomName: rooms[roomCode].roomName,
                adminId: rooms[roomCode].adminId,
                participants: Object.values(rooms[roomCode].participants),
                pathId: rooms[roomCode].pathId,
            });
        }
    });

    socket.on("my-location", ({ roomCode, userId, latitude, longitude }: { roomCode: string; userId: string; latitude: number; longitude: number }) => {
        if (rooms[roomCode] && rooms[roomCode].participants[userId]) {
            console.log(`User ${userId} updated location in room ${roomCode}`);
            rooms[roomCode].participants[userId].latitude = latitude;
            rooms[roomCode].participants[userId].longitude = longitude;

            locationIO.to(roomCode).emit("location-updated", Object.values(rooms[roomCode].participants));
        }
    });

    socket.on('disconnect', () => {
        // console.log('🔴 Location Handler: User disconnected:', socket.id);

        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            const usersInRoom = room.participants;
            for (const userId in usersInRoom) {
                if (usersInRoom[userId].socketId === socket.id) {
                    delete usersInRoom[userId];
                    console.log(`Removed user ${userId} from room ${roomCode}`);

                    // Update room members
                    locationIO.to(roomCode).emit("room-users", Object.values(usersInRoom));

                    // If no users left, optionally delete the room
                    if (Object.keys(usersInRoom).length === 0) {
                        delete rooms[roomCode];
                        console.log(`Deleted empty room ${roomCode}`);
                    } else if (room.adminId === userId) {
                        // Admin left, assign new admin?
                        const remainingUserIds = Object.keys(usersInRoom);
                        if (remainingUserIds.length > 0) {
                            room.adminId = remainingUserIds[0];
                            // Optionally notify about admin change
                        }
                    }
                    break;
                }
            }
        }
    });
};
