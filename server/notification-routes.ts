import { Express } from "express";
import { storage } from "./storage";

export function registerNotificationRoutes(app: Express) {
  // Get notifications for current user
  app.get("/api/notifications", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const notifications = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const count = await storage.getUnreadNotificationCount(req.user.id);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).send("Invalid notification ID");
      }

      // Verify the notification belongs to the user
      const notification = await storage.getNotification(notificationId);
      if (!notification || notification.userId !== req.user.id) {
        return res.status(404).send("Notification not found");
      }

      await storage.markNotificationAsRead(notificationId);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/mark-all-read", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      await storage.markAllNotificationsAsRead(req.user.id);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });
}