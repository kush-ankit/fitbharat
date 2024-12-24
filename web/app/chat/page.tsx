"use client"
import { SocketContext } from "@/providers/SocketProvider";
import { FormEvent, useContext, useEffect, useState } from "react";

interface Message {
    sender: 'user' | 'friend';
    content: string;
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>('');
    const socket = useContext(SocketContext);

    const roomName = "1";

    useEffect(() => {
        if (socket) {
            console.log(socket)
            socket.emit('joinRoom', roomName);
        }
    }, [socket])

    useEffect(() => {
        if (socket) {
            socket.on('message', (data: string) => {
                setMessages([...messages, { sender: 'friend', content: data }]);
                console.log(data);
            });
            return () => {
                socket.off('message');
            };
        }
    }, [socket, messages]);

    const handleSend = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (input.trim()) {
            if (socket) {
                socket.emit('message', { message: input, room: "1" });
            }
            setMessages([...messages, { sender: 'user', content: input }]);
            setInput('');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-blue-600 text-white py-4 px-6 text-lg font-semibold">
                Two-Person Chat
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex mb-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                    >
                        <div
                            className={`px-4 py-2 rounded-lg max-w-xs ${msg.sender === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-800'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Field */}
            <form className="bg-white p-4 flex items-center border-t text-black" onSubmit={handleSend}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="ml-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                    Send
                </button>
            </form>
        </div>
    );
}



