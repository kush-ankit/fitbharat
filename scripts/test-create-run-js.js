const { io } = require("socket.io-client");
const fs = require('fs');

function log(message) {
    console.log(message);
    fs.appendFileSync('test_output_js.txt', message + '\n');
}

// Override console
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
    const msg = args.map(a => String(a)).join(' ');
    fs.appendFileSync('test_output_js.txt', 'LOG: ' + msg + '\n');
    originalConsoleLog.apply(console, args);
};

console.error = (...args) => {
    const msg = args.map(a => String(a)).join(' ');
    fs.appendFileSync('test_output_js.txt', 'ERROR: ' + msg + '\n');
    originalConsoleError.apply(console, args);
};

const API_URL = "http://localhost:3000";

async function main() {
    try {
        // 1. Register a random user
        const randomSuffix = Math.floor(Math.random() * 10000);
        const user = {
            user_name: `Test User ${randomSuffix}`,
            user_email: `test${randomSuffix}@example.com`,
            user_id: `testuser${randomSuffix}`,
            user_password: "password123"
        };

        console.log("Registering user...", user.user_email);
        const registerRes = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user)
        });

        if (!registerRes.ok) {
            console.error("Registration failed:", await registerRes.text());
            return;
        }

        // 2. Login
        console.log("Logging in...");
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_email: user.user_email,
                user_password: user.user_password
            })
        });

        if (!loginRes.ok) {
            console.error("Login failed:", await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Got token:", token ? "Yes" : "No");

        // 3. Connect to socket
        console.log("Connecting to socket...");
        const socket = io(API_URL, {
            auth: { token }
        });

        socket.on("connect", () => {
            console.log("Connected to socket:", socket.id);

            // 4. Create run
            console.log("Creating run...");
            socket.emit("create-run");
        });

        socket.on("run-created", (data) => {
            console.log("Run created successfully!");
            console.log("Room Code:", data.roomCode);
            console.log("Admin ID:", data.adminId);
            console.log("Users:", data.users);

            if (data.adminId === user.user_id) {
                console.log("✅ SUCCESS: Creator is admin.");
            } else {
                console.error("❌ FAILURE: Creator is NOT admin.");
            }

            socket.disconnect();
            process.exit(0);
        });

        socket.on("error", (err) => {
            console.error("Socket error:", err);
            socket.disconnect();
            process.exit(1);
        });

        socket.on("connect_error", (err) => {
            console.error("Connection error:", err.message);
            socket.disconnect();
            process.exit(1);
        });

    } catch (err) {
        console.error("Main error:", err);
    }
}

main();
