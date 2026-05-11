import express from "express";
import multer from "multer";
import {
  adminStats,
  bulkUploadUsers,
  createUser,
  departmentFaculty,
  listUsers,
  principalDirectory,
  resetPassword,
  updateUserStatus
} from "../controllers/userController.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createUserRules, resetPasswordRules } from "../validators/userValidators.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 } });

router.use(protect);
router.get("/department/faculty", authorize("hod"), departmentFaculty);
router.get("/principal/directory", authorize("principal"), principalDirectory);

router.use(authorize("admin"));
router.get("/", listUsers);
router.get("/stats", adminStats);
router.post("/", createUserRules, validate, createUser);
router.post("/bulk", upload.single("file"), bulkUploadUsers);
router.patch("/:id/reset-password", resetPasswordRules, validate, resetPassword);
router.patch("/:id/status", updateUserStatus);

export default router;
