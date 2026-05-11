import { body } from "express-validator";

export const loginRules = [
  body("email").isEmail().withMessage("Enter a valid email address").normalizeEmail(),
  body("password").isString().notEmpty().withMessage("Password is required")
];

export const changePasswordRules = [
  body("currentPassword").isLength({ min: 8 }),
  body("newPassword").isStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  })
];
