import { validate as validateDeepEmail } from "deep-email-validator";
import User from "../models/User.js";

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_TIMEOUT_MS = 10000;
const shouldValidateSmtp = () => process.env.EMAIL_VALIDATE_SMTP === "true";

export class EmailValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new EmailValidationError("Unable to verify email currently. Please try again.", 503)), timeoutMs);
    })
  ]);

const normalizeEmail = (email) => String(email || "").toLowerCase().trim();

const ensureOrgEmail = (email) => {
  const domain = process.env.ORG_EMAIL_DOMAIN;
  if (domain && !email.endsWith(`@${domain.toLowerCase()}`)) {
    throw new EmailValidationError(`Only @${domain} organization emails are allowed`);
  }
};

const messageForValidationResult = (result) => {
  if (result.validators?.regex?.valid === false) return "Invalid email format";
  if (result.validators?.disposable?.valid === false) return "Disposable email addresses are not allowed";
  if (result.validators?.mx?.valid === false) return "Email address does not exist";
  if (shouldValidateSmtp() && result.validators?.smtp?.valid === false) return "Email address does not exist";
  if (result.validators?.typo?.valid === false) return "Invalid email format";
  return "Email address does not exist";
};

export const verifyAccountEmail = async (email, { checkDuplicate = true } = {}) => {
  const normalizedEmail = normalizeEmail(email);

  if (!EMAIL_FORMAT.test(normalizedEmail)) {
    throw new EmailValidationError("Invalid email format");
  }

  ensureOrgEmail(normalizedEmail);

  if (checkDuplicate) {
    const existing = await User.exists({ email: normalizedEmail });
    if (existing) throw new EmailValidationError("Email is already registered", 409);
  }

  try {
    const timeoutMs = Number(process.env.EMAIL_VALIDATION_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
    const result = await withTimeout(
      validateDeepEmail({
        email: normalizedEmail,
        sender: process.env.EMAIL_FROM || process.env.EMAIL_USER || `no-reply@${normalizedEmail.split("@")[1]}`,
        validateRegex: true,
        validateMx: true,
        validateTypo: true,
        validateDisposable: true,
        validateSMTP: shouldValidateSmtp()
      }),
      timeoutMs
    );

    if (!result.valid) {
      throw new EmailValidationError(messageForValidationResult(result));
    }

    return { email: normalizedEmail, message: "Email address is valid" };
  } catch (error) {
    if (error instanceof EmailValidationError) throw error;
    throw new EmailValidationError("Unable to verify email currently. Please try again.", 503);
  }
};
