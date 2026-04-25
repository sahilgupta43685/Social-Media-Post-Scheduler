const crypto = require("crypto");

const stateStore = new Map();

const createOAuthState = (payload, ttlMs = 10 * 60 * 1000) => {
  const state = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + ttlMs;
  stateStore.set(state, { payload, expiresAt });
  return state;
};

const consumeOAuthState = (state) => {
  const record = stateStore.get(state);
  if (!record) return null;

  stateStore.delete(state);
  if (Date.now() > record.expiresAt) return null;
  return record.payload;
};

module.exports = {
  createOAuthState,
  consumeOAuthState
};
