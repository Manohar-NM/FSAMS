import User from "../models/User.js";
import Appraisal from "../models/Appraisal.js";
import { parseUserCsv } from "../utils/csv.js";
import { sendAccountEmail } from "../utils/email.js";

const ensureOrgEmail = (email) => {
  const domain = process.env.ORG_EMAIL_DOMAIN;
  if (domain && !email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)) {
    throw new Error(`Only @${domain} organization emails are allowed`);
  }
};

const ensureValidPassword = (password) => {
  if (!String(password || "").trim()) {
    throw new Error("Password is required");
  }
  if (String(password).length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
};

const createAccount = async ({ name, email, role, department = "CSE", facultyId = "", designation = "", password }) => {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  ensureOrgEmail(normalizedEmail);
  ensureValidPassword(password);
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new Error(`User already exists: ${normalizedEmail}`);

  const user = await User.create({
    name,
    email: normalizedEmail,
    role,
    department,
    facultyId,
    designation,
    password,
    isFirstLogin: false
  });
  await sendAccountEmail({ to: normalizedEmail, name });
  return { user };
};

export const createUser = async (req, res) => {
  const result = await createAccount(req.body);
  res.status(201).json({
    message: "User account created successfully",
    user: {
      id: result.user._id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      department: result.user.department,
      facultyId: result.user.facultyId,
      designation: result.user.designation
    }
  });
};

export const bulkUploadUsers = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "CSV file is required" });

  const rows = parseUserCsv(req.file.buffer);
  const created = [];
  const failed = [];

  for (const row of rows) {
    try {
      const result = await createAccount(row);
      created.push({
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        department: result.user.department,
        facultyId: result.user.facultyId,
        designation: result.user.designation
      });
    } catch (error) {
      failed.push({ row, error: error.message });
    }
  }

  res.status(201).json({ created, failed });
};

export const listUsers = async (req, res) => {
  const users = await User.find().sort({ role: 1, department: 1, name: 1 });
  res.json({ users });
};

export const adminStats = async (req, res) => {
  const [totalFaculties, totalHods, totalSubmissions, pendingReviews] = await Promise.all([
    User.countDocuments({ role: "faculty" }),
    User.countDocuments({ role: "hod" }),
    Appraisal.countDocuments({ status: { $ne: "draft" } }),
    Appraisal.countDocuments({ status: "submitted" })
  ]);

  res.json({ totalFaculties, totalHods, totalSubmissions, pendingReviews });
};

export const departmentFaculty = async (req, res) => {
  const faculty = await User.find({ role: "faculty", department: req.user.department })
    .select("name email facultyId department designation")
    .sort({ name: 1 });

  const appraisals = await Appraisal.find({ department: req.user.department })
    .select("userId faculty status submittedAt updatedAt academicYear")
    .sort({ updatedAt: -1 });

  const latestByFaculty = new Map();
  appraisals.forEach((appraisal) => {
    const id = String(appraisal.userId || appraisal.faculty);
    if (!latestByFaculty.has(id)) latestByFaculty.set(id, appraisal);
  });

  res.json({
    faculty: faculty.map((member) => ({
      ...member.toObject(),
      latestAppraisal: latestByFaculty.get(String(member._id)) || null
    }))
  });
};

export const principalDirectory = async (req, res) => {
  const [hods, departments] = await Promise.all([
    User.find({ role: "hod", isActive: true }).select("name email facultyId department designation").sort({ department: 1 }),
    User.distinct("department", { role: { $in: ["faculty", "hod"] } })
  ]);

  res.json({ departments: departments.length ? departments : ["CSE"], hods });
};

export const resetPassword = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.password = req.body.password;
  user.isFirstLogin = false;
  await user.save();
  res.json({ message: "Password updated successfully" });
};

export const updateUserStatus = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: Boolean(req.body.isActive) },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
};
