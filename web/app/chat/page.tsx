"use client"
import ChatComponent from "@/components/ChatComponent";
import { SocketProvider } from "@/providers/SocketProvider";

export default function Chat() {
    return (
        <SocketProvider>
            <ChatComponent />
        </SocketProvider>
    )
}



