const express = require("express");
const cors = require("cors");
const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const integrationRoutes = require("./routes/integrationRoutes");

const app = express();

const parseAllowedOrigins = () => {
  const raw = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser tools like curl/Postman and same-origin server calls.
    if (!origin) return callback(null, true);

    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS blocked: origin is not allowed"));
  },
  credentials: true
}));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ message: "Backend is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/integrations", integrationRoutes);

module.exports = app;
