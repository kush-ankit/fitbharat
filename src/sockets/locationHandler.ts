import { Namespace, Server, Socket } from 'socket.io';
import { Path } from '../models/path.model';
import { Room } from '../models/room.model';
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

    // Helper to handle user leaving a room (used by both disconnect and leave-run)
    const handleUserLeave = async (roomCode: string, socketId: string) => {
        if (!rooms[roomCode]) return;
        const room = rooms[roomCode];
        const usersInRoom = room.participants;
        let leftUser: any = null;
        let leftUserId: string = '';

        for (const userId in usersInRoom) {
            if (usersInRoom[userId].socketId === socketId) {
                leftUser = { ...usersInRoom[userId] };
                leftUserId = userId;
                delete usersInRoom[userId];
                logger.info(`Removed user ${userId} from room ${roomCode}`);
                break;
            }
        }

        if (!leftUser) return;

        // Notify remaining participants
        locationIO.to(roomCode).emit("user-left", leftUser);
        locationIO.to(roomCode).emit("room-users", Object.values(usersInRoom));
        locationIO.to(roomCode).emit("roomUsers", Object.values(usersInRoom));

        // Clean up empty room or update admin
        if (Object.keys(usersInRoom).length === 0) {
            delete rooms[roomCode];
            logger.info(`Deleted empty room ${roomCode}`);
            // Update MongoDB: set status to 'FINISHED'
            try {
                await Room.findOneAndUpdate(
                    { roomCode, status: { $in: ['STARTING', 'ACTIVE'] } },
                    { status: 'FINISHED', participants: [] }
                );
                logger.info(`Persisted room ${roomCode} status change to FINISHED`);
            } catch (err) {
                logger.error(`Database error setting room ${roomCode} to FINISHED:`, err);
            }
        } else {
            if (room.adminId === leftUserId) {
                // Assign new admin to the first remaining user
                const remainingUserIds = Object.keys(usersInRoom);
                if (remainingUserIds.length > 0) {
                    room.adminId = remainingUserIds[0];
                }
            }
            // Update MongoDB: update participants list and adminId
            try {
                await Room.findOneAndUpdate(
                    { roomCode, status: { $in: ['STARTING', 'ACTIVE'] } },
                    {
                        adminId: room.adminId,
                        participants: Object.values(usersInRoom)
                    }
                );
                logger.info(`Persisted user leave cleanup for room ${roomCode} in database`);
            } catch (err) {
                logger.error(`Database error updating room ${roomCode} on user leave:`, err);
            }
        }
    };

    // ─────────────────────────────────────────────────────────
    // CREATE ROOM
    // ─────────────────────────────────────────────────────────
    const handleCreateRoom = async ({ roomCode, roomName, pathId }: { roomCode: string; roomName: string; pathId?: string }) => {
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

        const participant = {
            socketId: socket.id,
            userId: userId,
            userName: authenticatedUser.user_name || authenticatedUser.name || userId,
            latitude: 0,
            longitude: 0,
        };

        rooms[roomCode].participants[userId] = participant;

        // Persist to MongoDB: Delete old rooms with same code first, then save new Room
        try {
            await Room.deleteOne({ roomCode });
            const newDbRoom = new Room({
                roomCode,
                roomName,
                adminId: userId,
                pathId: pathId || undefined,
                status: 'STARTING',
                participants: [participant],
                name: roomName,
                description: roomName,
                isActive: true,
            });
            await newDbRoom.save();
            logger.info(`Persisted room ${roomCode} to database`);
        } catch (err) {
            logger.error(`Database error creating room ${roomCode}:`, err);
        }

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
    const handleJoinRoom = async ({ roomCode }: { roomCode: string; userId?: string }) => {
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

        const participant = {
            socketId: socket.id,
            userName: authenticatedUser.user_name || authenticatedUser.name || userId,
            userId: userId,
            latitude: 0,
            longitude: 0,
        };

        rooms[roomCode].participants[userId] = participant;

        // Persist to MongoDB
        try {
            await Room.findOneAndUpdate(
                { roomCode, status: { $in: ['STARTING', 'ACTIVE'] } },
                {
                    $set: {
                        participants: Object.values(rooms[roomCode].participants)
                    }
                }
            );
            logger.info(`Persisted user ${userId} join to room ${roomCode} in database`);
        } catch (err) {
            logger.error(`Database error joining user ${userId} to room ${roomCode}:`, err);
        }

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
            try {
                await Room.findOneAndUpdate(
                    { roomCode, status: 'STARTING' },
                    { status: 'ACTIVE' }
                );
                logger.info(`Persisted room ${roomCode} status change to ACTIVE`);
            } catch (err) {
                logger.error(`Database error setting room ${roomCode} to ACTIVE:`, err);
            }

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
        userId: clientUserId,
        latitude,
        longitude,
    }: {
        roomCode: string;
        userId: string;
        latitude: number;
        longitude: number;
    }) => {
        const authenticatedUser = (socket as any).user;
        const userId = (authenticatedUser?.user_id || authenticatedUser?.uid) ?? clientUserId;

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
    // LEAVE RUN / LOBBY
    // ─────────────────────────────────────────────────────────
    const handleLeaveRunEvent = async ({ roomCode }: { roomCode: string }) => {
        if (roomCode) {
            await handleUserLeave(roomCode, socket.id);
        }
    };

    socket.on("leave-run", handleLeaveRunEvent);
    socket.on("leaveRoom", handleLeaveRunEvent);

    // ─────────────────────────────────────────────────────────
    // DISCONNECT — cleanup
    // ─────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
        for (const roomCode in rooms) {
            await handleUserLeave(roomCode, socket.id);
        }
    });
};

