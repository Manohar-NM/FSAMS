import bcrypt from "bcrypt";
import mongoose from "mongoose";

export const USER_ROLES = ["faculty", "hod", "principal", "admin"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: USER_ROLES, required: true },
    department: { type: String, required: true, trim: true },
    facultyId: { type: String, trim: true, uppercase: true, sparse: true, index: true },
    designation: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
    isFirstLogin: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
