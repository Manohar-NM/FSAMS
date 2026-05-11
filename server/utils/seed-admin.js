import bcrypt from "bcrypt";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const admin = {
  name: "Default Admin",
  email: "nmm@fsams.com",
  password: "nmm@123",
  role: "admin",
  department: "Administration",
  designation: "System Administrator",
  isActive: true,
  isFirstLogin: false
};

await connectDB();

const existingAdmin = await User.findOne({ email: admin.email });

if (existingAdmin) {
  console.log(`Admin already exists: ${admin.email}`);
  process.exit(0);
}

const now = new Date();
const hashedPassword = await bcrypt.hash(admin.password, 12);

await User.collection.insertOne({
  name: admin.name,
  email: admin.email,
  password: hashedPassword,
  role: admin.role,
  department: admin.department,
  designation: admin.designation,
  isActive: admin.isActive,
  isFirstLogin: admin.isFirstLogin,
  createdAt: now,
  updatedAt: now
});

console.log(`Default admin created: ${admin.email}`);
process.exit(0);
