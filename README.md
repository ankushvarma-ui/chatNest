# ChatNest - Secure MERN Chat Rooms

ChatNest is a real-time chat-room application built with the MERN stack:

- **Frontend:** React.js with `.jsx` components/pages, Bootstrap, custom CSS, and Vite.
- **Backend:** Node.js, Express, Socket.IO, JWT authentication, and MongoDB/Mongoose.
- **Realtime communication:** Socket.IO for room membership, messaging, typing indicators, and live user lists.

## Project Structure

```
mern-chat-room/
  backend/
    middleware/       JWT authentication middleware
    models/           Mongoose database models
    routes/           REST API routes
    socket/           Socket.IO event handlers
    utils/            validation, rate-limit, room, and profanity helpers
    server.js         Express and Socket.IO entry point
  frontend/
    src/
      components/     reusable `.jsx` React components
      pages/          `.jsx` room browser and chat pages
      api.js          REST API helper
      socket.js       Socket.IO client helper
    vite.config.js    local-only Vite server configuration
```

## Implemented Features

| Area | Feature | Implementation |
| --- | --- | --- |
| Rooms | Room browser | `GET /api/rooms` returns active rooms, live user count, and password-lock status. |
| Rooms | User limit | Each room permits at most 10 connected users. |
| Rooms | Unique usernames | The same username cannot be connected twice in one room. |
| Rooms | Password protection | A password can be set when a room is created; only its bcrypt hash is retained in memory. |
| Rooms | Automatic cleanup | A room is removed when its last user disconnects. Unused pre-join rooms expire after two minutes. |
| Security | JWT flow | Joining through the REST API creates a two-hour JWT. The React app stores it in `sessionStorage`. |
| Security | Socket verification | Every supported client Socket.IO event verifies the JWT again before processing. |
| Security | REST protection | Message history requires `Authorization: Bearer <token>` and only permits access to the token's room. |
| Security | IP rate limiting | Express limits REST API requests to 100 per minute per IP. |
| Messaging | Message limit | Messages must contain 1-500 characters. |
| Messaging | User rate limit | Each connected user can send 5 messages per 5 seconds. The UI shows a toast if limited. |
| Messaging | Profanity filter | Messages containing configured blocked words are rejected before broadcast or database storage. |
| Messaging | MongoDB storage | Valid messages are saved to MongoDB through the `Message` Mongoose model. |
| Messaging | Pagination | The UI loads 20 messages at a time, with a **Load older messages** button. |
| Realtime UI | Live feedback | Users, messages, notices, typing indicators, full-room errors, password errors, and rate-limit errors update in real time. |

## Database Setup

MongoDB must be running before messages can be persisted. Create `mern-chat-room/backend/.env` from `mern-chat-room/backend/.env.example` and configure it.

### Option 1: Local MongoDB

Install and start MongoDB locally, then use:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb://127.0.0.1:27017/mern-chatroom
JWT_SECRET=use-a-long-random-secret-here
```

### Option 2: MongoDB Atlas

Create a MongoDB Atlas database, allow your current IP address in Atlas Network Access, and use its exact connection string:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/mern-chatroom?retryWrites=true&w=majority
```

Do not commit `.env` or share the Atlas password. When the backend starts correctly, it prints `MongoDB connected`.

## Install and Run

Open two terminals from the repository root.

### Backend

```powershell
cd mern-chat-room/backend
Copy-Item .env.example .env
# Edit .env with your MongoDB URI and JWT secret.
npm install
npm run dev
```

`npm run dev` uses Nodemon and serves the API at `http://localhost:5000`.

### Frontend

```powershell
cd mern-chat-room/frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

The Vite frontend runs locally at `http://127.0.0.1:5173`. Its Vite configuration binds only to `127.0.0.1`, so it is not exposed on the local network.

Keep the frontend local by setting `frontend/.env.local` to:

```env
VITE_API_URL=http://127.0.0.1:5000
VITE_SOCKET_URL=http://127.0.0.1:5000
```

## API Reference

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/rooms` | No | List active rooms. |
| `POST` | `/api/rooms/join` | No | Validate username, room, and optional password; receive a JWT. |
| `GET` | `/api/messages/:room?before=<ISO timestamp>` | JWT | Return up to 20 older messages for the authenticated room. |

Messages are intentionally written only through the authenticated `sendMessage` Socket.IO event. This ensures rate limits, room access, profanity checks, and username validation apply to every saved message.

## Verify Database Storage

1. Start MongoDB and confirm the backend log displays `MongoDB connected`.
2. Open `http://localhost:3000`, create or join a room, and send a normal message.
3. In MongoDB Compass or `mongosh`, open the `mern-chatroom` database and the `messages` collection.
4. The saved document includes `room`, `username`, `text`, `timestamp`, `createdAt`, and `updatedAt`.
5. Refresh the chat page. Recent messages load from MongoDB; use **Load older messages** for prior pages.

## Validation Completed

- Backend dependencies installed and backend JavaScript syntax checks passed.
- Frontend dependencies installed and `npm run build` compiled successfully.
- The temporary React `build/` artifact was deleted afterward.
- The local room-list endpoint responded successfully.

## Current Database Requirement

The application code is ready to save messages, but database persistence only works after `MONGO_URI` points to a reachable MongoDB server. The currently configured Atlas hostname was not reachable from this machine, and local MongoDB was not running on port `27017` during validation.
