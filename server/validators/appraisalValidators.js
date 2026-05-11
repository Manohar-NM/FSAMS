import { body } from "express-validator";

export const appraisalDraftRules = [
  body("academicYear").trim().matches(/^\d{4}-\d{2}$/),
  body("semester").isInt({ min: 1, max: 8 }).toInt(),
  body("_id").optional().isMongoId(),
  body("currentStep").optional().isString().trim(),
  body("parts").isObject(),
  body("remarks.faculty").optional().isString().trim()
];

export const reviewRules = [
  body("remarks").optional().isString().trim().isLength({ max: 2000 }),
  body("reason").optional().isString().trim().isLength({ max: 2000 })
];
