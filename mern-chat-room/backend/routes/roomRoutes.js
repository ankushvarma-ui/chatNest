const express = require("express");
const { issueToken } = require("../middleware/auth");
const { listRooms, prepareRoom } = require("../utils/roomStore");
const {
  validatePassword,
  validateRoom,
  validateUsername,
} = require("../utils/validation");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ rooms: listRooms() });
});

router.post("/join", async (req, res) => {
  try {
    const room = validateRoom(req.body.room);
    const username = validateUsername(req.body.username);
    const password = validatePassword(req.body.password);
    const validationError = room.error || username.error || password.error;
    if (validationError)
      return res
        .status(400)
        .json({ error: "VALIDATION_ERROR", message: validationError });

    const result = await prepareRoom({
      room: room.value,
      username: username.value,
      password: password.value,
    });
    const errors = {
      ROOM_FULL: [409, "This room is full (10 users maximum)."],
      USERNAME_TAKEN: [409, "That username is already in this room."],
      ROOM_PASSWORD_INCORRECT: [401, "The room password is incorrect."],
    };
    if (result.error) {
      const [status, message] = errors[result.error] || [
        400,
        "Unable to join this room.",
      ];
      return res.status(status).json({ error: result.error, message });
    }

    res.json({
      token: issueToken({ room: room.value, username: username.value }),
      room: room.value,
      username: username.value,
    });
  } catch (error) {
    console.error("Room join error:", error);
    res
      .status(500)
      .json({ error: "JOIN_FAILED", message: "Unable to prepare this room." });
  }
});

module.exports = router;
