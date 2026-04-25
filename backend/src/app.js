const express = require("express");
const cors = require("cors");
const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const integrationRoutes = require("./routes/integrationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ message: "Backend is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/integrations", integrationRoutes);

module.exports = app;
