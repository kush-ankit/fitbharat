
export interface ServerToClientEvents {
    create_lobby: (data: { roomId: string; pathId: string }) => void;
    user_joined: (data: { userId: string; username: string }) => void;
    race_started: (data: { startTime: string }) => void; // ISO string
    update_leaderboard: (data: { leaderboard: any[] }) => void;
    user_finished: (data: { userId: string; rank: number; time: number }) => void;
    error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
    create_lobby: (data: { pathId: string; userId: string; username: string }) => void;
    join_lobby: (data: { roomId: string; userId: string; username: string }) => void;
    start_race: (data: { roomId: string }) => void;
    update_location: (data: {
        roomId: string;
        userId: string;
        lat: number;
        lng: number;
        speed?: number;
        heading?: number;
    }) => void;
    race_finished: (data: { roomId: string; userId: string }) => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    userId: string;
    roomId: string;
}
