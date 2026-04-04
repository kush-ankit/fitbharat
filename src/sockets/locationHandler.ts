import { Namespace, Server, Socket } from 'socket.io';
import { Path } from '../models/path.model';
import logger from '../utils/logger';

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
    logger.debug(`🟢 Location Handler: User connected: ${socket.id}`);

    // ─────────────────────────────────────────────────────────
    // CREATE ROOM — supports both kebab-case (legacy) and
    // camelCase (React Native mobile app) event names
    // ─────────────────────────────────────────────────────────
    const handleCreateRoom = ({ roomCode, roomName, pathId }: { roomCode: string; roomName: string; pathId?: string }) => {
        const authenticatedUser = (socket as any).user;

        if (!authenticatedUser) {
            socket.emit("error", { message: "Authentication required to create a run." });
            return;
        }

        const userId = authenticatedUser.user_id || authenticatedUser.uid;

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
            userName: authenticatedUser.user_name || authenticatedUser.name || userId,
            latitude: 0,
            longitude: 0,
        };

        socket.join(roomCode);
        logger.info(`User ${userId} created and joined room ${roomCode} as admin`);

        const payload = {
            roomCode,
            roomName,
            adminId: userId,
            participants: Object.values(rooms[roomCode].participants),
        };

        // Emit with both naming conventions so legacy & new clients both receive it
        socket.emit("run-created", payload);
        socket.emit("roomCreated", payload);
    };

    socket.on("create-run", handleCreateRoom);   // legacy kebab-case
    socket.on("createRoom", handleCreateRoom);   // React Native camelCase

    // ─────────────────────────────────────────────────────────
    // JOIN ROOM
    // ─────────────────────────────────────────────────────────
    const handleJoinRoom = ({ roomCode }: { roomCode: string; userId?: string }) => {
        const authenticatedUser = (socket as any).user;

        if (!authenticatedUser) {
            socket.emit("error", { message: "Authentication required to join a run." });
            return;
        }

        const userId = authenticatedUser.user_id || authenticatedUser.uid;

        if (!rooms[roomCode]) {
            socket.emit("error", { message: "Room does not exist." });
            return;
        }

        logger.info(`User ${userId} joined room ${roomCode}`);
        socket.join(roomCode);

        rooms[roomCode].participants[userId] = {
            socketId: socket.id,
            userName: authenticatedUser.user_name || authenticatedUser.name || userId,
            userId: userId,
            latitude: 0,
            longitude: 0,
        };

        const payload = {
            roomCode,
            roomName: rooms[roomCode].roomName,
            adminId: rooms[roomCode].adminId,
            participants: Object.values(rooms[roomCode].participants),
        };

        // Emit with both naming conventions
        locationIO.to(roomCode).emit("room-users", payload);
        locationIO.to(roomCode).emit("roomUsers", payload);
    };

    socket.on("join-run", handleJoinRoom);   // legacy
    socket.on("joinRoom", handleJoinRoom);   // React Native

    // ─────────────────────────────────────────────────────────
    // START RUN
    // ─────────────────────────────────────────────────────────
    socket.on("start-run", async ({ roomCode }: { roomCode: string }) => {
        if (rooms[roomCode]) {
            const payload = {
                roomCode,
                roomName: rooms[roomCode].roomName,
                adminId: rooms[roomCode].adminId,
                participants: Object.values(rooms[roomCode].participants),
                pathId: rooms[roomCode].pathId,
            };
            locationIO.to(roomCode).emit("run-started", payload);
            locationIO.to(roomCode).emit("runStarted", payload);
        }
    });

    // ─────────────────────────────────────────────────────────
    // UPDATE LOCATION
    // ─────────────────────────────────────────────────────────
    const handleUpdateLocation = ({
        roomCode,
        userId,
        latitude,
        longitude,
    }: {
        roomCode: string;
        userId: string;
        latitude: number;
        longitude: number;
    }) => {
        if (rooms[roomCode] && rooms[roomCode].participants[userId]) {
            logger.debug(`User ${userId} updated location in room ${roomCode}`);
            rooms[roomCode].participants[userId].latitude = latitude;
            rooms[roomCode].participants[userId].longitude = longitude;

            const participants = Object.values(rooms[roomCode].participants);

            // Emit with both naming conventions
            locationIO.to(roomCode).emit("location-updated", participants);
            locationIO.to(roomCode).emit("participantLocationUpdate", participants);
        }
    };

    socket.on("my-location", handleUpdateLocation);    // legacy
    socket.on("updateLocation", handleUpdateLocation); // React Native

    // ─────────────────────────────────────────────────────────
    // DISCONNECT — cleanup
    // ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            const usersInRoom = room.participants;
            for (const userId in usersInRoom) {
                if (usersInRoom[userId].socketId === socket.id) {
                    const leftUser = { ...usersInRoom[userId] };
                    delete usersInRoom[userId];
                    logger.info(`Removed user ${userId} from room ${roomCode}`);

                    // Notify remaining participants
                    locationIO.to(roomCode).emit("user-left", leftUser);
                    locationIO.to(roomCode).emit("room-users", Object.values(usersInRoom));
                    locationIO.to(roomCode).emit("roomUsers", Object.values(usersInRoom));

                    // Clean up empty room
                    if (Object.keys(usersInRoom).length === 0) {
                        delete rooms[roomCode];
                        logger.info(`Deleted empty room ${roomCode}`);
                    } else if (room.adminId === userId) {
                        // Assign new admin to the first remaining user
                        const remainingUserIds = Object.keys(usersInRoom);
                        if (remainingUserIds.length > 0) {
                            room.adminId = remainingUserIds[0];
                        }
                    }
                    break;
                }
            }
        }
    });
};
