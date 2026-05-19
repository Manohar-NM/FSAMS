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
  updateUserStatus,
  validateAccountEmail
} from "../controllers/userController.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createUserRules, resetPasswordRules } from "../validators/userValidators.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 } });

router.use(protect);
router.get("/department/faculty", authorize("hod"), asyncHandler(departmentFaculty));
router.get("/principal/directory", authorize("principal"), asyncHandler(principalDirectory));

router.use(authorize("admin"));
router.get("/", asyncHandler(listUsers));
router.get("/stats", asyncHandler(adminStats));
router.get("/validate-email", asyncHandler(validateAccountEmail));
router.post("/", createUserRules, validate, asyncHandler(createUser));
router.post("/bulk", upload.single("file"), asyncHandler(bulkUploadUsers));
router.patch("/:id/reset-password", resetPasswordRules, validate, asyncHandler(resetPassword));
router.patch("/:id/status", asyncHandler(updateUserStatus));

export default router;
