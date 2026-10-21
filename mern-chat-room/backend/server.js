
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
require("dotenv").config();

const messageRoutes = require("./routes/messageRoutes");
const roomRoutes = require("./routes/roomRoutes");
const { handleSocket } = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);

const port = process.env.PORT || 5000;
const clientUrl =
  process.env.CLIENT_URL || "http://127.0.0.1:5173";
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  throw new Error("MONGO_URI is required");
}

// CORS configuration
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: "16kb" }));

// Rate limiting
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Health check
app.get("/", (req, res) => {
  res.json({ message: "ChatNest API is running." });
});

// API routes
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);

// Socket event handlers
handleSocket(io);

// Connect to MongoDB and then start the server
async function startServer() {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");

    server.listen(port, "0.0.0.0", () => {
      console.log(`ChatNest server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
