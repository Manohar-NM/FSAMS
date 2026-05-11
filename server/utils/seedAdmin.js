import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

await connectDB();

const email = process.env.ADMIN_EMAIL || "admin@aiet.org.in";
const exists = await User.findOne({ email });

if (!exists) {
  await User.create({
    name: process.env.ADMIN_NAME || "System Admin",
    email,
    password: process.env.ADMIN_PASSWORD || "Admin@12345",
    role: "admin",
    department: "Administration",
    isFirstLogin: false
  });
  console.log(`Admin created: ${email}`);
} else {
  console.log(`Admin already exists: ${email}`);
}

process.exit(0);
