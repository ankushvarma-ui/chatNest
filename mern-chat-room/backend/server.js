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
const clientOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : ["http://localhost:3000"];

const io = new Server(server, { cors: { origin: clientOrigins, methods: ["GET", "POST"] } });
app.use(cors({ origin: clientOrigins, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(rateLimit({ windowMs: 60 * 1000, limit: 100, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/", (req, res) => res.json({ message: "ChatNest API is running." }));
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);
handleSocket(io);

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/mern-chatroom";
mongoose.connect(mongoUri)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error.message));

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
