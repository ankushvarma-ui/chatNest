const ROOM_PATTERN = /^[a-zA-Z0-9_-]{2,32}$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{2,24}$/;

function normalise(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateRoom(room) {
  const value = normalise(room).toLowerCase();
  if (!ROOM_PATTERN.test(value)) return { error: "Room names must be 2-32 letters, numbers, hyphens, or underscores." };
  return { value };
}

function validateUsername(username) {
  const value = normalise(username);
  if (!USERNAME_PATTERN.test(value)) return { error: "Usernames must be 2-24 letters, numbers, hyphens, or underscores." };
  return { value };
}

function validatePassword(password) {
  const value = typeof password === "string" ? password : "";
  if (value.length > 64) return { error: "Room passwords cannot exceed 64 characters." };
  return { value };
}

module.exports = { validateRoom, validateUsername, validatePassword };
