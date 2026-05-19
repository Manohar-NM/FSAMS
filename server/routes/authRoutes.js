import express from "express";
import { changePassword, login, me } from "../controllers/authController.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { changePasswordRules, loginRules } from "../validators/authValidators.js";

const router = express.Router();

router.post("/login", loginRules, validate, asyncHandler(login));
router.get("/me", protect, me);
router.patch("/change-password", protect, changePasswordRules, validate, asyncHandler(changePassword));

export default router;
