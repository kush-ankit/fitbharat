import { Path, IPath } from '../models/path.model';
import RaceSession from '../models/RaceSession';
import * as turf from '@turf/turf';

export interface PlayerState {
    userId: string;
    username: string;
    socketId: string;
    lat: number;
    lng: number;
    progress: number; // 0 to 1
    rank?: number;
    finished: boolean;
    finishTime?: number; // ms duration
    speed?: number; // km/h
}

export interface RaceData {
    roomId: string;
    pathId: string;
    path: IPath;
    participants: Map<string, PlayerState>;
    status: 'waiting' | 'racing' | 'finished';
    startTime?: number;
}

class RaceManager {
    private races: Map<string, RaceData> = new Map();

    async createLobby(roomId: string, pathId: string, hostUserId: string, hostUsername: string, socketId: string): Promise<RaceData> {
        const path = await Path.findById(pathId);
        if (!path) throw new Error("Path not found");

        const race: RaceData = {
            roomId,
            pathId,
            path,
            participants: new Map(),
            status: 'waiting'
        };

        this.addParticipant(race, hostUserId, hostUsername, socketId);
        this.races.set(roomId, race);
        return race;
    }

    getRace(roomId: string) {
        return this.races.get(roomId);
    }

    joinLobby(roomId: string, userId: string, username: string, socketId: string): RaceData {
        const race = this.races.get(roomId);
        if (!race) throw new Error("Lobby not found");
        if (race.status !== 'waiting') throw new Error("Race already started");

        this.addParticipant(race, userId, username, socketId);
        return race;
    }

    private addParticipant(race: RaceData, userId: string, username: string, socketId: string) {
        race.participants.set(userId, {
            userId,
            username,
            socketId,
            lat: 0,
            lng: 0,
            progress: 0,
            finished: false
        });
    }

    async startRace(roomId: string): Promise<boolean> {
        const race = this.races.get(roomId);
        if (!race) return false;
        race.status = 'racing';
        race.startTime = Date.now();
        await this.initRaceSession(roomId);
        return true;
    }

    async updatePlayerLocation(roomId: string, userId: string, lat: number, lng: number, speed: number): Promise<{ finished: boolean; player: PlayerState, race: RaceData } | null> {
        const race = this.races.get(roomId);
        if (!race || race.status !== 'racing') return null;

        const player = race.participants.get(userId);
        if (!player || player.finished) return null;

        // Anti-Cheat: Speed check (simple 40km/h threshold)
        if (speed > 40) {
            console.warn(`User ${userId} ignored due to high speed: ${speed}`);
            return null;
        }

        player.lat = lat;
        player.lng = lng;
        player.speed = speed;

        // Calculate Progress
        try {
            const line = turf.lineString(race.path.route.coordinates);
            const pt = turf.point([lng, lat]); // GeoJSON is [lng, lat]
            const snapped = turf.nearestPointOnLine(line, pt, { units: 'kilometers' });

            const totalLength = turf.length(line, { units: 'kilometers' });
            const distanceAlong = snapped.properties.location || 0; // distance from start in km

            player.progress = Math.min(Math.max(distanceAlong / totalLength, 0), 1);

            // Finish Condition (99% or simplified distance check)
            if (player.progress >= 0.99) {
                player.finished = true;
                player.progress = 1;
                player.finishTime = Date.now() - (race.startTime || 0);

                // Calculate Rank
                const finishedCount = Array.from(race.participants.values()).filter(p => p.finished).length;
                player.rank = finishedCount; // 1-based if strictly sequential, but need verify concurrency

                // Ideally save to DB immediately or batch
                await this.saveRaceResult(race, player);

                return { finished: true, player, race };
            }

            return { finished: false, player, race };
        } catch (e) {
            console.error("Error calculating progress:", e);
            return null;
        }
    }

    private async saveRaceResult(race: RaceData, player: PlayerState) {
        // Find existing session or create/update?
        // Actually usually we create one RaceSession per race or per user? 
        // User requested: "RaceSession ... participants (Array ...)"
        // So one document per Race.
        // We really should create the RaceSession document when race starts or ends.

        // Let's Find or Create the RaceSession for this roomId (assuming roomId is unique per session or we track it)
        // Since roomId is memory only, maybe use a unique ID for the session.
        // For now, simpler: Upsert RaceSession for this roomId?
        // Problem: roomId might be reused or random.
        // Better: Create RaceSession when race starts, store _id in RaceData?
        // Or just upsert based on startTime + pathId?
        // I will implement: UPSERT based on roomId (assuming roomId is unique enough or handled)
        // Note: The prompt implies RaceSession stores results.

        // Let's just find One that has this path and approx start time? 
        // Or better, let's just push to a list if we had a session ID.
        // I'll skip complex session management and just save when everyone finishes or individaul record?
        // Prompt: "Stores the results after a race finishes."
        // "participants: Array of objects with user, rank, time"

        // Strategy: We need a DB race session ID.
        // I'll add `dbId` to `RaceData`.
    }

    // Call this when race starts to init DB record
    async initRaceSession(roomId: string) {
        const race = this.races.get(roomId);
        if (!race) return;
        const session = new RaceSession({
            pathId: race.path._id,
            startTime: new Date(),
            endTime: new Date(), // placeholder
            participants: []
        });
        await session.save();
        (race as any).dbId = session._id;
    }

    async saveParticipantResult(roomId: string, userId: string) {
        const race = this.races.get(roomId);
        if (!race || !(race as any).dbId) return;

        const player = race.participants.get(userId);
        if (!player || !player.finished) return;

        await RaceSession.findByIdAndUpdate((race as any).dbId, {
            $push: {
                participants: {
                    userId: player.userId,
                    username: player.username,
                    rank: player.rank,
                    time: player.finishTime
                }
            }
        });

        // Check if all finished
        const allFinished = Array.from(race.participants.values()).every(p => p.finished);
        if (allFinished) {
            race.status = 'finished';
            await RaceSession.findByIdAndUpdate((race as any).dbId, {
                endTime: new Date()
            });
            this.races.delete(roomId); // Clean up
        }
    }

    // Helper to get Leaderboard
    getLeaderboard(roomId: string) {
        const race = this.races.get(roomId);
        if (!race) return [];
        return Array.from(race.participants.values()).map(p => ({
            userId: p.userId,
            username: p.username,
            progress: p.progress,
            rank: p.rank,
            finished: p.finished,
            lat: p.lat,
            lng: p.lng
        }));
    }
}

export default new RaceManager();
