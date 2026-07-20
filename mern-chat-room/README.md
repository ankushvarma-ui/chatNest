# ChatNest — MERN Real-time Chat Rooms

A full-stack MERN chat application with Socket.IO for real-time messaging.

```
mern-chat-room/
├── backend/
│   ├── server.js
│   ├── .env.example
│   ├── models/
│   │   └── Message.js
│   ├── routes/
│   │   └── messageRoutes.js
│   └── socket/
│       └── socketHandler.js
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── index.css
        ├── socket.js
        ├── components/
        │   ├── MessageBubble.js
        │   ├── UserList.js
        │   ├── JoinRoom.js      ← re-exports JoinPage
        │   └── ChatRoom.js      ← re-exports ChatPage
        └── pages/
            ├── JoinPage.js
            └── ChatPage.js
```

---

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

---

## Setup

### 1. Backend

```bash
cd backend
npm install

# Copy and edit the env file
cp .env.example .env
# Edit .env:
#   MONGO_URI=mongodb://localhost:27017/mern-chatroom
#   CLIENT_URL=http://localhost:3000
#   PORT=5000

npm run dev   # or: npm start
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Open **http://localhost:3000**

---

## Socket Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `joinRoom` | client → server | `{ username, room }` | Join a named room |
| `sendMessage` | client → server | `{ text }` | Send a message |
| `receiveMessage` | server → client | `{ username, text, timestamp, room }` | Broadcast to room |
| `messageHistory` | server → client | `Message[]` | Last 50 messages on join |
| `userJoined` | server → client | `{ username, users[] }` | Someone joined |
| `userLeft` | server → client | `{ username, users[] }` | Someone left |
| `typing` | client → server | — | User started typing |
| `stopTyping` | client → server | — | User stopped typing |
| `userTyping` | server → client | `{ username }` | Typing indicator |
| `userStoppedTyping` | server → client | `{ username }` | Typing stopped |

---

## REST API

| Method | Route | Description |
|---|---|---|
| GET | `/api/messages/:room` | Fetch last 50 messages |
| POST | `/api/messages` | Save a message |

---

## Deployment

### Vercel (Frontend) + Render (Backend)

#### 1. Deploy Backend to Render

1. Push your code to GitHub
2. Go to [Render.com](https://render.com) and connect your GitHub account
3. Create a new **Web Service**
4. Select your repository
5. Configure:
   - **Root Directory**: `mern-chat-room/backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add Environment Variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `CLIENT_URL`: Your future Vercel app URL (e.g., `https://your-app.vercel.app`)
   - `PORT`: `5000`
7. Deploy and copy the Render URL

#### 2. Deploy Frontend to Vercel

1. Go to [Vercel.com](https://vercel.com) and connect your GitHub account
2. Import your repository
3. Configure:
   - **Root Directory**: `mern-chat-room/frontend`
   - **Framework Preset**: Create React App
4. Add Environment Variable:
   - `REACT_APP_SOCKET_URL`: Your Render backend URL (e.g., `https://chat-room-system.onrender.com`)
5. Deploy

#### 3. Update Backend CORS

After deploying, update your backend's environment variables on Render:
- Set `CLIENT_URL` to your actual Vercel URL

---

## Features

- **Real-time messaging** via Socket.IO
- **Multiple rooms** — each room is isolated
- **Message history** persisted in MongoDB
- **Typing indicators** with animated dots
- **Animated chat bubbles** (fade-in + slide)
- **Responsive layout** — sidebar collapses on mobile
- **Bootstrap 5** as the only styling framework
- **Dark theme** with cohesive design tokens
