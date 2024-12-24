"use client"
import { SocketContext } from "@/providers/SocketProvider";
import { useContext, useEffect, useState } from "react";

export default function Home() {
  const socket = useContext(SocketContext);
  const [roomName, setRoomName] = useState("");

  const handleJoin = () => {
    if (roomName.trim() === "") {
      alert("Please enter a room name!");
      return;
    }
    console.log(`Joining room: ${roomName}`);
    if (socket) {
      socket.emit("joinRoom", roomName)
    }
  };

  useEffect(() => {
    socket?.on('roomData', (msg) => {
      console.log(msg);
    });

    return () => {
      socket?.off('message');
    }
  }, [socket])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-black">
      <div className="bg-white shadow-lg rounded-lg p-6 w-96">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">Join a Room</h1>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Enter Room Name"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleJoin}
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-300"
        >
          Join Room
        </button>
      </div>
    </div>
  );
}
