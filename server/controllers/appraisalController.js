import Appraisal from "../models/Appraisal.js";
import { calculateScores } from "../utils/scoring.js";
import { notifyRole, notifyUsers } from "../utils/notifications.js";
import { generateAppraisalPdf } from "../utils/pdf.js";

const canFacultyEdit = (status) => ["draft", "returned_for_edit"].includes(status);

const findForUser = (id) => Appraisal.findById(id).populate("userId faculty hodId", "name email department role facultyId designation");

export const saveDraft = async (req, res) => {
  const { _id, academicYear, semester, parts, remarks = {}, currentStep = "partA" } = req.body;
  const existing = _id
    ? await Appraisal.findOne({ _id, userId: req.user._id })
    : await Appraisal.findOne({ userId: req.user._id, academicYear, semester });

  if (_id && !existing) {
    return res.status(404).json({ message: "Appraisal not found" });
  }

  if (existing && !canFacultyEdit(existing.status)) {
    return res.status(423).json({ message: "Appraisal is locked after submission" });
  }

  if (existing && (existing.academicYear !== academicYear || Number(existing.semester) !== Number(semester))) {
    const duplicate = await Appraisal.findOne({
      _id: { $ne: existing._id },
      userId: req.user._id,
      academicYear,
      semester
    });
    if (duplicate) {
      return res.status(409).json({ message: "Appraisal already exists for this academic year and semester." });
    }
  }

  if (!existing) {
    const duplicate = await Appraisal.findOne({ userId: req.user._id, academicYear, semester });
    if (duplicate) {
      return res.status(409).json({ message: "Appraisal already exists for this academic year and semester." });
    }
  }

  const payload = {
    userId: req.user._id,
    faculty: req.user._id,
    department: req.user.department,
    academicYear,
    semester,
    status: existing?.status || "draft",
    currentStep,
    parts,
    scores: calculateScores(parts),
    remarks: { ...(existing?.remarks?.toObject?.() || existing?.remarks || {}), faculty: remarks.faculty || "" }
  };

  let appraisal;
  try {
    appraisal = existing
      ? await Appraisal.findByIdAndUpdate(existing._id, payload, { new: true })
      : await Appraisal.create(payload);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Appraisal already exists for this academic year and semester." });
    }
    throw error;
  }

  res.json({ appraisal });
};

export const submitAppraisal = async (req, res) => {
  const appraisal = await Appraisal.findOne({ _id: req.params.id, userId: req.user._id });
  if (!appraisal) return res.status(404).json({ message: "Appraisal not found" });
  if (!canFacultyEdit(appraisal.status)) return res.status(423).json({ message: "Appraisal is locked" });

  appraisal.status = "submitted";
  appraisal.submittedAt = new Date();
  appraisal.remarks.returnReason = "";
  await appraisal.save();

  await notifyRole({
    role: "hod",
    department: req.user.department,
    actor: req.user._id,
    appraisal: appraisal._id,
    type: "submission",
    title: "New appraisal submitted",
    message: `New appraisal submitted by Faculty ID ${req.user.facultyId || req.user.name}`
  });

  res.json({ appraisal });
};

export const myAppraisals = async (req, res) => {
  const appraisals = await Appraisal.find({ userId: req.user._id }).sort({ academicYear: -1, semester: -1, createdAt: -1 });
  res.json({ appraisals });
};

export const departmentQueue = async (req, res) => {
  const appraisals = await Appraisal.find({
    department: req.user.department,
    status: { $in: ["submitted", "returned_for_edit", "hod_approved", "rejected"] }
  })
    .populate("userId faculty", "name email department facultyId designation")
    .sort({ updatedAt: -1 });
  res.json({ appraisals });
};

export const principalQueue = async (req, res) => {
  const query = { status: { $in: ["hod_approved", "final_reviewed"] } };
  if (req.query.department) query.department = req.query.department;
  if (req.query.hodId) query.hodId = req.query.hodId;

  const appraisals = await Appraisal.find(query)
    .populate("userId faculty hodId", "name email department facultyId designation")
    .sort({ updatedAt: -1 });
  res.json({ appraisals });
};

export const adminList = async (req, res) => {
  const appraisals = await Appraisal.find()
    .populate("userId faculty hodId", "name email department facultyId designation")
    .sort({ updatedAt: -1 });
  res.json({ appraisals });
};

export const getAppraisal = async (req, res) => {
  const appraisal = await findForUser(req.params.id);
  if (!appraisal) return res.status(404).json({ message: "Appraisal not found" });

  const isOwner = String(appraisal.userId._id) === String(req.user._id);
  const isDeptHod = req.user.role === "hod" && appraisal.department === req.user.department;
  const isPrincipalAllowed = req.user.role === "principal" && ["hod_approved", "final_reviewed"].includes(appraisal.status);
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isDeptHod && !isPrincipalAllowed && !isAdmin) {
    return res.status(403).json({ message: "Access denied" });
  }
  res.json({ appraisal });
};

export const hodAction = async (req, res) => {
  const { action } = req.params;
  const { remarks = "", reason = "" } = req.body;
  const appraisal = await Appraisal.findById(req.params.id);

  if (!appraisal) return res.status(404).json({ message: "Appraisal not found" });
  if (appraisal.department !== req.user.department) return res.status(403).json({ message: "Department access denied" });
  if (appraisal.status !== "submitted") return res.status(400).json({ message: "Only submitted appraisals can be reviewed by HOD" });

  const transitions = {
    approve: "hod_approved",
    reject: "rejected",
    return: "returned_for_edit"
  };

  if (!transitions[action]) return res.status(400).json({ message: "Invalid HOD action" });

  const reviewText = String(remarks || "").trim();
  const reasonText = String(reason || reviewText).trim();
  if (["return", "reject"].includes(action) && !reasonText) {
    return res.status(400).json({ message: action === "reject" ? "Rejection reason is required" : "Return remarks are required" });
  }

  appraisal.status = transitions[action];
  appraisal.remarks.hod = reviewText;
  appraisal.hodRemarks = reviewText;
  appraisal.hodId = req.user._id;
  if (action === "reject") appraisal.remarks.rejectionReason = reasonText;
  if (action === "return") appraisal.remarks.returnReason = reasonText;
  if (action === "approve") appraisal.approvedAt = new Date();
  appraisal.hodReviewedAt = new Date();
  await appraisal.save();

  if (action === "approve") {
    await notifyRole({
      role: "principal",
      department: appraisal.department,
      actor: req.user._id,
      appraisal: appraisal._id,
      type: "approved",
      title: "Appraisal sent to Principal",
      message: `${appraisal.department} appraisal approved by HOD and sent for final review`
    });
  } else {
    await notifyUsers({
      recipients: [appraisal.userId],
      actor: req.user._id,
      appraisal: appraisal._id,
      department: appraisal.department,
      type: action === "reject" ? "rejected" : "returned",
      title: action === "reject" ? "Appraisal rejected" : "Appraisal returned for correction",
      message: reasonText || `Your appraisal was ${action === "reject" ? "rejected" : "returned"} by HOD`
    });
  }

  const updated = await findForUser(appraisal._id);
  res.json({ appraisal: updated });
};

export const principalRemarks = async (req, res) => {
  const appraisal = await Appraisal.findById(req.params.id);
  if (!appraisal) return res.status(404).json({ message: "Appraisal not found" });
  if (appraisal.status !== "hod_approved" && appraisal.status !== "final_reviewed") {
    return res.status(400).json({ message: "Principal can only review HOD-approved appraisals" });
  }

  appraisal.remarks.principal = req.body.remarks || "";
  appraisal.principalRemarks = req.body.remarks || "";
  appraisal.status = "final_reviewed";
  appraisal.principalReviewedAt = new Date();
  await appraisal.save();

  await notifyUsers({
    recipients: [appraisal.userId, appraisal.hodId].filter(Boolean),
    actor: req.user._id,
    appraisal: appraisal._id,
    department: appraisal.department,
    type: "finalized",
    title: "Final review completed",
    message: "Principal remarks added and appraisal finalized"
  });

  res.json({ appraisal });
};

export const uploadProofs = async (req, res) => {
  const appraisal = await Appraisal.findOne({ _id: req.params.id, userId: req.user._id });
  if (!appraisal) return res.status(404).json({ message: "Appraisal not found" });
  if (!canFacultyEdit(appraisal.status)) return res.status(423).json({ message: "Proof upload is locked after submission" });

  appraisal.proofs.push(
    ...req.files.map((file) => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    }))
  );
  await appraisal.save();
  res.json({ appraisal });
};

export const downloadPdf = async (req, res) => {
  const appraisal = await findForUser(req.params.id);
  if (!appraisal) return res.status(404).json({ message: "Appraisal not found" });

  const isOwner = String(appraisal.userId._id) === String(req.user._id);
  const isDeptHod = req.user.role === "hod" && appraisal.department === req.user.department;
  const isPrincipalAllowed = req.user.role === "principal" && ["hod_approved", "final_reviewed"].includes(appraisal.status);
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isDeptHod && !isPrincipalAllowed && !isAdmin) {
    return res.status(403).json({ message: "Access denied" });
  }

  const pdf = await generateAppraisalPdf(appraisal);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=FAA-${appraisal.academicYear}.pdf`);
  res.send(pdf);
};
