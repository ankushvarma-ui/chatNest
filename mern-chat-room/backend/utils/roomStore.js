const bcrypt = require("bcryptjs");

const MAX_ROOM_USERS = 10;
const EMPTY_ROOM_TTL_MS = 2 * 60 * 1000;
const rooms = new Map();

function key(room) {
  return room.toLowerCase();
}

function scheduleEmptyCleanup(room) {
  setTimeout(() => {
    const entry = rooms.get(key(room));
    if (entry && entry.users.size === 0) rooms.delete(key(room));
  }, EMPTY_ROOM_TTL_MS).unref();
}

async function prepareRoom({ room, username, password }) {
  let entry = rooms.get(key(room));
  if (!entry) {
    entry = {
      name: room,
      passwordHash: password ? await bcrypt.hash(password, 10) : null,
      users: new Map(),
    };
    rooms.set(key(room), entry);
    scheduleEmptyCleanup(room);
  } else if (
    entry.passwordHash &&
    !(await bcrypt.compare(password || "", entry.passwordHash))
  ) {
    return { error: "ROOM_PASSWORD_INCORRECT" };
  }
  if (entry.users.size >= MAX_ROOM_USERS) return { error: "ROOM_FULL" };
  if (
    [...entry.users.values()].some(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    )
  ) {
    return { error: "USERNAME_TAKEN" };
  }
  return { room: entry };
}

function addUser(room, socketId, username) {
  const entry = rooms.get(key(room));
  if (!entry) return { error: "ROOM_NOT_FOUND" };
  if (entry.users.has(socketId)) return { room: entry };
  if (entry.users.size >= MAX_ROOM_USERS) return { error: "ROOM_FULL" };
  if (
    [...entry.users.values()].some(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    )
  )
    return { error: "USERNAME_TAKEN" };
  entry.users.set(socketId, { username, sentAt: [] });
  return { room: entry };
}

function removeUser(room, socketId) {
  const entry = rooms.get(key(room));
  if (!entry) return [];
  entry.users.delete(socketId);
  const users = getUsernames(room);
  if (entry.users.size === 0) rooms.delete(key(room));
  return users;
}

function getUsernames(room) {
  const entry = rooms.get(key(room));
  return entry ? [...entry.users.values()].map((user) => user.username) : [];
}

function listRooms() {
  return [...rooms.values()]
    .filter((room) => room.users.size > 0)
    .map((room) => ({
      name: room.name,
      userCount: room.users.size,
      hasPassword: Boolean(room.passwordHash),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function recordMessage(room, socketId) {
  const user = rooms.get(key(room))?.users.get(socketId);
  if (!user) return { allowed: false, retryAfter: 5 };
  const now = Date.now();
  user.sentAt = user.sentAt.filter((timestamp) => now - timestamp < 5000);
  if (user.sentAt.length >= 5)
    return {
      allowed: false,
      retryAfter: Math.ceil((5000 - (now - user.sentAt[0])) / 1000),
    };
  user.sentAt.push(now);
  return { allowed: true };
}

module.exports = {
  MAX_ROOM_USERS,
  addUser,
  getUsernames,
  listRooms,
  prepareRoom,
  recordMessage,
  removeUser,
};
