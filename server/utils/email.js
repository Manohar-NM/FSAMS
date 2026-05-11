import nodemailer from "nodemailer";

export const sendAccountEmail = async ({ to, name }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return false;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "FSAMS account created",
    html: `<p>Dear ${name},</p><p>Your FSAMS account is ready.</p><p>Please use the password provided by your administrator to sign in.</p>`
  });
  return true;
};
