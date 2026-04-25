require("dotenv").config();

const redisConnection = require("../config/redis");

const run = async () => {
  try {
    const result = await redisConnection.ping();
    console.log("Redis ping result:", result); // should be PONG
  } catch (error) {
    console.error("Redis ping failed:", error.message);
  } finally {
    await redisConnection.quit();
  }
};

run();
