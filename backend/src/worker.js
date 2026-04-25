require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const redisConnection = require("./config/redis");
const postWorker = require("./workers/postWorker");

const startWorker = async () => {
  await connectDB();
  console.log("Worker started and listening for scheduled jobs...");
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
