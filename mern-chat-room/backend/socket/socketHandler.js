const Message = require("../models/Message");
const { verifyToken } = require("../middleware/auth");
const { hasProfanity } = require("../utils/profanity");
const {
  addUser,
  getUsernames,
  recordMessage,
  removeUser,
} = require("../utils/roomStore");

function respondError(socket, ack, error, message, extra = {}) {
  const payload = { ok: false, error, message, ...extra };
  socket.emit("chat:error", payload);
  if (typeof ack === "function") ack(payload);
}

function currentClaims(socket) {
  return verifyToken(socket.handshake.auth?.token);
}

function handleSocket(io) {
  io.use((socket, next) => {
    try {
      socket.data.auth = currentClaims(socket);
      next();
    } catch (error) {
      next(new Error("AUTH_REQUIRED"));
    }
  });

  io.on("connection", (socket) => {
    const authenticated = (handler) => async (payload, ack) => {
      let claims;
      try {
        claims = currentClaims(socket);
        socket.data.auth = claims;
      } catch (error) {
        return respondError(
          socket,
          ack,
          "AUTH_REQUIRED",
          "Your room session has expired. Please join again.",
        );
      }
      try {
        await handler(claims, payload || {}, ack);
      } catch (error) {
        console.error("Socket event error:", error);
        respondError(
          socket,
          ack,
          "SERVER_ERROR",
          "The request could not be completed.",
        );
      }
    };

    socket.on(
      "joinRoom",
      authenticated(async (claims, payload, ack) => {
        const result = addUser(claims.room, socket.id, claims.username);
        if (result.error === "ROOM_FULL")
          return respondError(
            socket,
            ack,
            result.error,
            "This room is full (10 users maximum).",
          );
        if (result.error === "USERNAME_TAKEN")
          return respondError(
            socket,
            ack,
            result.error,
            "That username is already in this room.",
          );
        if (result.error)
          return respondError(
            socket,
            ack,
            result.error,
            "The room is no longer available.",
          );

        socket.join(claims.room);
        socket.data.room = claims.room;
        socket.data.username = claims.username;
        const users = getUsernames(claims.room);
        io.to(claims.room).emit("room:users", { users });
        socket
          .to(claims.room)
          .emit("room:notice", { text: `${claims.username} joined the room.` });
        if (typeof ack === "function") ack({ ok: true, users });
      }),
    );

    socket.on(
      "sendMessage",
      authenticated(async (claims, payload, ack) => {
        if (socket.data.room !== claims.room)
          return respondError(
            socket,
            ack,
            "ROOM_ACCESS_DENIED",
            "Join the room before sending messages.",
          );
        const text =
          typeof payload.text === "string" ? payload.text.trim() : "";
        if (!text || text.length > 500)
          return respondError(
            socket,
            ack,
            "INVALID_MESSAGE",
            "Messages must be between 1 and 500 characters.",
          );
        if (hasProfanity(text))
          return respondError(
            socket,
            ack,
            "PROFANITY_BLOCKED",
            "Your message contains blocked language.",
          );

        const rate = recordMessage(claims.room, socket.id);
        if (!rate.allowed)
          return respondError(
            socket,
            ack,
            "RATE_LIMITED",
            "You can send only 5 messages every 5 seconds.",
            { retryAfter: rate.retryAfter },
          );

        const message = await Message.create({
          room: claims.room,
          username: claims.username,
          text,
          timestamp: new Date(),
        });
        io.to(claims.room).emit("message:new", message.toObject());
        if (typeof ack === "function") ack({ ok: true });
      }),
    );

    socket.on(
      "typing",
      authenticated((claims) => {
        if (socket.data.room === claims.room)
          socket.to(claims.room).emit("typing", { username: claims.username });
      }),
    );
    socket.on(
      "stopTyping",
      authenticated((claims) => {
        if (socket.data.room === claims.room)
          socket
            .to(claims.room)
            .emit("typing:stop", { username: claims.username });
      }),
    );

    socket.on("disconnect", () => {
      if (!socket.data.room) return;
      const users = removeUser(socket.data.room, socket.id);
      io.to(socket.data.room).emit("room:users", { users });
      socket
        .to(socket.data.room)
        .emit("room:notice", {
          text: `${socket.data.username} left the room.`,
        });
    });
  });
}

module.exports = { handleSocket };
