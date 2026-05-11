import jwt from "jsonwebtoken";
import User from "../models/User.js";

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  });

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  facultyId: user.facultyId,
  designation: user.designation,
  isFirstLogin: user.isFirstLogin
});

export const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").toLowerCase().trim();
  console.log("Login attempt", { email: normalizedEmail });

  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user) {
    console.warn("Login failed: user not found", { email: normalizedEmail });
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (!user.isActive) {
    console.warn("Login failed: inactive account", { email: normalizedEmail, userId: user._id });
    return res.status(403).json({ message: "Account is inactive. Contact administrator." });
  }

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    console.warn("Login failed: password mismatch", { email: normalizedEmail, userId: user._id });
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (!process.env.JWT_SECRET) {
    console.error("Login failed: JWT_SECRET is not configured");
    return res.status(500).json({ message: "Authentication service is not configured" });
  }

  console.log("Login successful", { email: normalizedEmail, userId: user._id, role: user.role });
  res.json({ token: signToken(user), user: userPayload(user) });
};

export const me = (req, res) => {
  res.json({ user: userPayload(req.user) });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }
  user.password = newPassword;
  user.isFirstLogin = false;
  await user.save();
  res.json({ message: "Password changed successfully" });
};
