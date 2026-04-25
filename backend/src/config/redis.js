const IORedis = require("ioredis");

if (!process.env.REDIS_URL) {
  throw new Error("Missing REDIS_URL in .env");
}

const redisConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true
});

redisConnection.on("connect", () => {
  console.log("Redis TCP connection established");
});

redisConnection.on("ready", () => {
  console.log("Redis connection is ready");
});

redisConnection.on("error", (error) => {
  // Helpful for protocol mistakes (redis:// vs rediss://), auth errors, etc.
  console.error("Redis connection error:", error.message);
});

module.exports = redisConnection;
