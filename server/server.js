import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`FSAMS API running on port ${port}`));

connectDB().catch((error) => {
  console.error(`MongoDB connection failed: ${error.message}`);
});
