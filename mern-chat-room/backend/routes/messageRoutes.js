const express = require("express");
const Message = require("../models/Message");
const { requireAuth } = require("../middleware/auth");
const { validateRoom } = require("../utils/validation");

const router = express.Router();

router.get("/:room", requireAuth, async (req, res) => {
  try {
    const roomResult = validateRoom(req.params.room);
    if (roomResult.error || roomResult.value !== req.auth.room) {
      return res
        .status(403)
        .json({
          error: "ROOM_ACCESS_DENIED",
          message: "This token cannot access that room.",
        });
    }

    const before = req.query.before ? new Date(req.query.before) : null;
    if (before && Number.isNaN(before.getTime())) {
      return res
        .status(400)
        .json({
          error: "INVALID_CURSOR",
          message: "The pagination cursor is invalid.",
        });
    }

    const query = { room: roomResult.value };
    if (before) query.timestamp = { $lt: before };
    const records = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(21)
      .lean();
    res.json({
      messages: records.slice(0, 20).reverse(),
      hasMore: records.length > 20,
    });
  } catch (error) {
    console.error("Message history error:", error);
    res
      .status(500)
      .json({
        error: "MESSAGE_HISTORY_FAILED",
        message: "Unable to load messages.",
      });
  }
});

module.exports = router;
