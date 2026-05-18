import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

const port = process.env.PORT || 5000;
const dbRetryMs = Number(process.env.DB_RETRY_MS || 15000);
let dbRetryTimer;

app.listen(port, () => console.log(`FSAMS API running on port ${port}`));

const scheduleDbConnection = async () => {
  clearTimeout(dbRetryTimer);
  dbRetryTimer = null;

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) return;

  try {
    globalThis.lastMongoConnectionError = "";
    await connectDB();
  } catch (error) {
    globalThis.lastMongoConnectionError = error.message;
    console.error(`MongoDB connection failed: ${error.message}`);
    console.log(`Retrying MongoDB connection in ${Math.round(dbRetryMs / 1000)} seconds...`);
    clearTimeout(dbRetryTimer);
    dbRetryTimer = setTimeout(scheduleDbConnection, dbRetryMs);
  }
};

mongoose.connection.on("disconnected", () => {
  if (!dbRetryTimer) scheduleDbConnection();
});

scheduleDbConnection();
