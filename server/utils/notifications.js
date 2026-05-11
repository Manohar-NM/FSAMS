import Notification from "../models/Notification.js";
import User from "../models/User.js";

export const notifyUsers = async ({ recipients, actor, appraisal, department, type, title, message }) => {
  const ids = recipients.filter(Boolean).map((recipient) => recipient._id || recipient);
  if (!ids.length) return [];

  return Notification.insertMany(
    ids.map((recipient) => ({
      recipient,
      actor,
      appraisal,
      department,
      type,
      title,
      message
    }))
  );
};

export const notifyRole = async ({ role, department, actor, appraisal, type, title, message }) => {
  const query = { role, isActive: true };
  if (department && role !== "principal") query.department = department;
  const users = await User.find(query).select("_id");
  return notifyUsers({ recipients: users, actor, appraisal, department, type, title, message });
};
