const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "replace-this-development-secret";

function issueToken({ room, username }) {
  return jwt.sign({ room, username }, JWT_SECRET, { expiresIn: "2h" });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    req.auth = verifyToken(header.startsWith("Bearer ") ? header.slice(7) : null);
    next();
  } catch (error) {
    res.status(401).json({ error: "AUTH_REQUIRED", message: "A valid room token is required." });
  }
}

module.exports = { issueToken, requireAuth, verifyToken };
