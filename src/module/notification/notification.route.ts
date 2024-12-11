import { jwtAuthMiddleware } from "@/module/auth/auth.middleware";
import { Router } from "express";
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
} from "./notification.controller";
import { validator } from "@middleware/validation.middleware";
import {
  getNotificationsSchema,
  markAsReadSchema,
} from "./notification.schema";

const notificationRouter = Router();

notificationRouter.use(jwtAuthMiddleware);

notificationRouter.get(
  "/",
  // #swagger.tags = ['notifications']
  // #swagger.description = 'Get all notifications for the logged in user'
  validator(getNotificationsSchema),
  getNotifications,
);

notificationRouter.post(
  "/:notificationId/read",
  // #swagger.tags = ['notifications']
  // #swagger.description = 'Mark a notification as read'
  validator(markAsReadSchema),
  markAsRead,
);

notificationRouter.post(
  "/read-all",
  // #swagger.tags = ['notifications']
  // #swagger.description = 'Mark all notifications as read'
  markAllAsRead,
);

export default notificationRouter;
