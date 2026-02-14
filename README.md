# FitBharat Server

This is the backend server for the FitBharat application, built with Node.js, Express, and TypeScript. It provides APIs for user authentication, chat, location tracking, and group management.

## Features

*   **Authentication**: User registration and login using JWT.
*   **User Management**: Manage user profiles and data.
*   **Real-time Chat**: Socket.io-based chat functionality.
*   **Location Tracking**: Real-time location updates and tracking.
*   **Groups & Rooms**: Create and manage groups and rooms for collaboration.

## Prerequisites

Ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (v16+ recommended)
*   [MongoDB](https://www.mongodb.com/) (Local or Atlas)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd fitbharatserver
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
# Server Configuration
PORT=3000

# Database Configuration
MONGO_URI=mongodb://localhost:27017/fitbharat

# Authentication
JWT_SECRET=your_jwt_secret_key_here
```

> **Note:** Replace `your_jwt_secret_key_here` with a strong secret key.

## Running the Server

### Development

To run the server in development mode with hot-reloading (using `nodemon`):

```bash
npm run dev
```

The server will start at `http://localhost:3000` (or the configured `PORT`).

### Production

To build and run the server for production:

1.  **Build the project:**
    ```bash
    npm run build
    ```

2.  **Start the server:**
    ```bash
    npm start
    ```

## Project Structure

```
src/
├── config/         # Configuration files (DB, etc.)
├── controllers/    # Route controllers
├── middlewares/    # Custom middlewares (Auth, Validation)
├── models/         # Mongoose models
├── routes/         # API routes
├── sockets/        # Socket.io handlers
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── index.ts        # Application entry point
```

## Socket.io Events

The server uses Socket.io for real-time features.

*   **Namespaces**:
    *   `/location`: For location updates.
    *   `/messages`: For chat messages.

Authentication is required for socket connections via the `auth.token` handshake.
