import { validationResult } from "express-validator";

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn("Validation failed", {
      path: req.originalUrl,
      method: req.method,
      errors: errors.array().map((error) => ({ field: error.path, message: error.msg }))
    });
    return res.status(422).json({ message: "Validation failed", errors: errors.array() });
  }
  next();
};
