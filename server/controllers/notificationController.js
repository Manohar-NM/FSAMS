import Notification from "../models/Notification.js";

export const listNotifications = async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate("actor", "name facultyId role")
    .populate("appraisal", "academicYear status");

  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.json({ notifications, unreadCount });
};

export const markNotificationRead = async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, recipient: req.user._id }, { isRead: true });
  res.json({ message: "Notification marked as read" });
};

export const markAllNotificationsRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: "Notifications marked as read" });
};
