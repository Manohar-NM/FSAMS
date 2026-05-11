import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import appraisalRoutes from "./routes/appraisalRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
]);

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`, {
    origin: req.headers.origin || "same-origin"
  });
  next();
});

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      console.warn("CORS blocked request", { origin, allowedOrigins: Array.from(allowedOrigins) });
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get("/", (req, res) => res.json({ name: "FSAMS API", status: "healthy" }));
app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();

  const status =
    mongoose.connection.readyState === 2 ? "connecting" : "unavailable";

  return res.status(503).json({
    message:
      status === "connecting"
        ? "Database is still connecting. Try again in a moment."
        : "Database unavailable. Check MongoDB Atlas network access and MONGO_URI.",
    database: status
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/appraisals", appraisalRoutes);
app.use("/api/notifications", notificationRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
