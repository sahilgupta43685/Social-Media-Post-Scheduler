require("dotenv").config();

const { validateCommonEnv } = require("./config/validateEnv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const redisConnection = require("./config/redis");
const postWorker = require("./workers/postWorker");

const startWorker = async () => {
  try {
    validateCommonEnv();
    await connectDB();
    console.log("Worker started and listening for scheduled jobs...");
  } catch (error) {
    console.error("Worker boot failed:", error.message);
    process.exit(1);
  }
};

startWorker();

const shutdown = async () => {
  await postWorker.close();
  await redisConnection.quit();
  await mongoose.connection.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
