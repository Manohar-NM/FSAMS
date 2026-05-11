import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import {
  adminList,
  departmentQueue,
  downloadPdf,
  getAppraisal,
  hodAction,
  myAppraisals,
  principalQueue,
  principalRemarks,
  saveDraft,
  submitAppraisal,
  uploadProofs
} from "../controllers/appraisalController.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { appraisalDraftRules, reviewRules } from "../validators/appraisalValidators.js";

const router = express.Router();
const uploadDir = path.join(process.cwd(), "uploads", "proofs");
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`)
});
const proofUpload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024, files: 5 } });

router.use(protect);
router.get("/mine", authorize("faculty"), myAppraisals);
router.post("/", authorize("faculty"), appraisalDraftRules, validate, saveDraft);
router.post("/:id/proofs", authorize("faculty"), proofUpload.array("proofs", 5), uploadProofs);
router.patch("/:id/submit", authorize("faculty"), submitAppraisal);
router.get("/department", authorize("hod"), departmentQueue);
router.patch("/:id/hod/:action", authorize("hod"), reviewRules, validate, hodAction);
router.get("/principal", authorize("principal"), principalQueue);
router.patch("/:id/principal-remarks", authorize("principal"), reviewRules, validate, principalRemarks);
router.get("/admin", authorize("admin"), adminList);
router.get("/:id/pdf", downloadPdf);
router.get("/:id", getAppraisal);

export default router;
