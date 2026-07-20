const blockedWords = ["asshole", "bastard", "bitch", "fuck", "shit"];
const pattern = new RegExp(`\\b(?:${blockedWords.join("|")})\\b`, "i");

function hasProfanity(text) {
  return pattern.test(text);
}

module.exports = { hasProfanity };
