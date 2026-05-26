require("dotenv").config();

const { validateCommonEnv } = require("./config/validateEnv");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    validateCommonEnv();
    const app = require("./app");
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`API server running on http://localhost:${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use.`);
        console.error("Stop the old process on this port, or change PORT in backend/.env.");
        return;
      }

      console.error("Server startup error:", error.message);
    });
  } catch (error) {
    console.error("Server boot failed:", error.message);
    process.exit(1);
  }
}

startServer();
