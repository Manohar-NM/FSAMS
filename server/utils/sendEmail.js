import nodemailer from "nodemailer";

const getLoginUrl = () => {
  if (process.env.LOGIN_URL) return process.env.LOGIN_URL;
  const [clientUrl] = String(process.env.CLIENT_URL || "").split(",");
  return clientUrl?.trim() || "http://localhost:5173";
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: Number(process.env.EMAIL_SEND_TIMEOUT_MS || 10000),
    greetingTimeout: Number(process.env.EMAIL_SEND_TIMEOUT_MS || 10000),
    socketTimeout: Number(process.env.EMAIL_SEND_TIMEOUT_MS || 10000)
  });
};

export const sendAccountCreatedEmail = async ({ to, name, role, department, password }) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  const loginUrl = getLoginUrl();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  await transporter.sendMail({
    from,
    to,
    subject: "FSAMS Portal Account Created",
    html: `
      <div style="font-family: Arial, sans-serif; color: #17211c; line-height: 1.55;">
        <h2 style="color: #16352f;">Welcome to the FSAMS Portal</h2>
        <p>Dear ${escapeHtml(name)},</p>
        <p>Your FSAMS portal account has been created. Please use the details below to sign in.</p>
        <table style="border-collapse: collapse; margin: 18px 0; min-width: 320px;">
          <tbody>
            <tr><th style="text-align: left; padding: 8px; border: 1px solid #cbd5d1;">Name</th><td style="padding: 8px; border: 1px solid #cbd5d1;">${escapeHtml(name)}</td></tr>
            <tr><th style="text-align: left; padding: 8px; border: 1px solid #cbd5d1;">Role</th><td style="padding: 8px; border: 1px solid #cbd5d1;">${escapeHtml(role)}</td></tr>
            <tr><th style="text-align: left; padding: 8px; border: 1px solid #cbd5d1;">Department</th><td style="padding: 8px; border: 1px solid #cbd5d1;">${escapeHtml(department)}</td></tr>
            <tr><th style="text-align: left; padding: 8px; border: 1px solid #cbd5d1;">Login Email</th><td style="padding: 8px; border: 1px solid #cbd5d1;">${escapeHtml(to)}</td></tr>
            <tr><th style="text-align: left; padding: 8px; border: 1px solid #cbd5d1;">Login Password</th><td style="padding: 8px; border: 1px solid #cbd5d1;">${escapeHtml(password)}</td></tr>
            <tr><th style="text-align: left; padding: 8px; border: 1px solid #cbd5d1;">Login URL</th><td style="padding: 8px; border: 1px solid #cbd5d1;"><a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a></td></tr>
          </tbody>
        </table>
        <p><strong>Please keep your password confidential and change it after first login.</strong></p>
        <p style="margin-top: 28px;">Alva's Institute of Engineering &amp; Technology</p>
      </div>
    `
  });

  return true;
};

export const sendLoginAlertEmail = async ({ to, name, role, loginTime, ipAddress, userAgent }) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const formattedTime = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: process.env.EMAIL_TIMEZONE || "Asia/Kolkata"
  }).format(loginTime || new Date());

  await transporter.sendMail({
    from,
    to,
    subject: "FSAMS Portal Login Alert",
    html: `
      <div style="font-family: Arial, sans-serif; color: #17211c; line-height: 1.55;">
        <h2 style="color: #16352f;">Your FSAMS account was logged in</h2>
        <p>Dear ${escapeHtml(name)},</p>
        <p>Your FSAMS portal account was successfully logged in.</p>
        <table style="border-collapse: collapse; margin: 18px 0; min-width: 320px;">
          <tbody>
            <tr><th style="text-align: left; padding: 8px; border: 1px solid #cbd5d1;">Account</th><td style="padding: 8px; border: 1px solid #cbd5d1;">${escapeHtml(to)}</td></tr>
            <tr><th style="text-align: left; padding: 8px; border: 1px solid #cbd5d1;">Role</th><td style="padding: 8px; border: 1px solid #cbd5d1;">${escapeHtml(role)}</td></tr>
            <tr><th style="text-align: left; padding: 8px; border: 1px solid #cbd5d1;">Login Time</th><td style="padding: 8px; border: 1px solid #cbd5d1;">${escapeHtml(formattedTime)}</td></tr>
            <tr><th style="text-align: left; padding: 8px; border: 1px solid #cbd5d1;">IP Address</th><td style="padding: 8px; border: 1px solid #cbd5d1;">${escapeHtml(ipAddress || "Unknown")}</td></tr>
            <tr><th style="text-align: left; padding: 8px; border: 1px solid #cbd5d1;">Device</th><td style="padding: 8px; border: 1px solid #cbd5d1;">${escapeHtml(userAgent || "Unknown")}</td></tr>
          </tbody>
        </table>
        <p>If this was not you, please contact your administrator immediately.</p>
        <p style="margin-top: 28px;">Alva's Institute of Engineering &amp; Technology</p>
      </div>
    `
  });

  return true;
};
