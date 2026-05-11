import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    appraisal: { type: mongoose.Schema.Types.ObjectId, ref: "Appraisal" },
    department: { type: String, trim: true, default: "CSE", index: true },
    type: {
      type: String,
      enum: ["submission", "returned", "rejected", "approved", "finalized"],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
