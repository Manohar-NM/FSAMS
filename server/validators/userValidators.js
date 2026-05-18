import { body } from "express-validator";
import { USER_ROLES } from "../models/User.js";

const passwordRules = [
  body("password")
    .isString()
    .withMessage("Password is required")
    .bail()
    .custom((value) => String(value || "").trim().length > 0)
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("confirmPassword")
    .isString()
    .withMessage("Confirm password is required")
    .bail()
    .custom((value) => String(value || "").trim().length > 0)
    .withMessage("Confirm password is required")
    .bail()
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords must match")
];

export const createUserRules = [
  body("name").trim().isLength({ min: 2 }),
  body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),
  body("role").isIn(USER_ROLES),
  body("department").trim().isLength({ min: 2 }),
  body("facultyId").optional({ checkFalsy: true }).trim().isLength({ min: 2 }),
  body("designation").optional({ checkFalsy: true }).trim().isLength({ min: 2 }),
  ...passwordRules
];

export const resetPasswordRules = [
  ...passwordRules
];
