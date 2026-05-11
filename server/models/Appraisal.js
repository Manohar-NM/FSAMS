import mongoose from "mongoose";

export const APPRAISAL_STATUSES = [
  "draft",
  "submitted",
  "returned_for_edit",
  "hod_approved",
  "rejected",
  "final_reviewed"
];

const appraisalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hodId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    department: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 8, default: 1 },
    status: { type: String, enum: APPRAISAL_STATUSES, default: "draft", index: true },
    currentStep: { type: String, default: "partA", trim: true },
    parts: { type: mongoose.Schema.Types.Mixed, default: {} },
    scores: {
      teaching: { type: Number, default: 0 },
      research: { type: Number, default: 0 },
      service: { type: Number, default: 0 },
      sections: { type: mongoose.Schema.Types.Mixed, default: {} },
      rawTotal: { type: Number, default: 0 },
      maxTotal: { type: Number, default: 100 },
      normalizedTotal: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    remarks: {
      faculty: { type: String, default: "" },
      hod: { type: String, default: "" },
      principal: { type: String, default: "" },
      rejectionReason: { type: String, default: "" },
      returnReason: { type: String, default: "" }
    },
    hodRemarks: { type: String, default: "" },
    principalRemarks: { type: String, default: "" },
    proofs: [
      {
        originalName: String,
        filename: String,
        path: String,
        mimetype: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    submittedAt: Date,
    approvedAt: Date,
    hodReviewedAt: Date,
    principalReviewedAt: Date
  },
  { timestamps: true }
);

appraisalSchema.index({ userId: 1, academicYear: 1, semester: 1 }, { unique: true });
appraisalSchema.pre("validate", function setFacultyAlias(next) {
  if (!this.faculty && this.userId) this.faculty = this.userId;
  next();
});

export default mongoose.model("Appraisal", appraisalSchema);
