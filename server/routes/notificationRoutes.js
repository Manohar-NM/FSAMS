import express from "express";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../controllers/notificationController.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.get("/", asyncHandler(listNotifications));
router.patch("/read-all", asyncHandler(markAllNotificationsRead));
router.patch("/:id/read", asyncHandler(markNotificationRead));

export default router;
