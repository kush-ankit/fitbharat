import { io } from "socket.io-client";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

// MOCK DATA for testing
// You should have a user in your local DB with this ID or similar structure
// Ideally we would fetch a real user from DB, but for a quick script we'll sign a token manually
// if we have the secret.
const TEST_USER = {
    _id: "6753a3ae9454157771764653", // Replace with a valid User _id from your DB
    userid: "testuser",
    name: "Test User",
    email: "test@example.com"
};

const TEST_CHAT_ID = "private_testuser_otheruser";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; // ensure this matches your .env

// Generate a valid token
const token = jwt.sign({ id: TEST_USER._id, userid: TEST_USER.userid }, JWT_SECRET, { expiresIn: '1h' });

console.log("Generated Token:", token);

const socket = io("http://localhost:3000", {
    auth: {
        token: token
    }
});

socket.on("connect", () => {
    console.log("Connected to socket server with ID:", socket.id);

    // 1. Join a specific room logic is handled on server upon connection.
    // We can test by sending a message to a chat ID that the user SHOULD be part of.
    // NOTE: This assumes the user "TEST_USER._id" has "TEST_CHAT_ID" in their `chats` array in DB.

    // Send a message
    const messageData = {
        chatId: TEST_CHAT_ID,
        sender: TEST_USER.userid,
        receiver: "otheruser",
        text: "Hello from test script! " + Date.now()
    };

    console.log("Sending message...", messageData);
    socket.emit("sendMessage", messageData);

    // Request history
    console.log("Requesting chat history...");
    socket.emit("getChatHistory", { chatId: TEST_CHAT_ID });
});

socket.on("receiveMessage", (message) => {
    console.log("Received Message:", message);
});

socket.on("chatHistory", (messages) => {
    console.log(`Received Chat History (${messages.length} messages):`);
    // console.log(messages);
    if (messages.length > 0) {
        console.log("Latest message:", messages[messages.length - 1]);
    }

    // Close after a brief delay to allow events to process
    setTimeout(() => {
        socket.disconnect();
        console.log("Test completed, disconnected.");
        process.exit(0);
    }, 2000);
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
});

socket.on("connect_error", (err) => {
    console.error("Connection Error:", err.message);
    process.exit(1);
});
