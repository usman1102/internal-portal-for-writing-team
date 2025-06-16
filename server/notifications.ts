// Simple notification system
interface SimpleNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  relatedTaskId?: number;
  relatedUserId?: number;
  isRead: boolean;
  createdAt: Date;
}

class NotificationManager {
  private notifications: Map<number, SimpleNotification> = new Map();
  private idCounter = 1;

  create(data: {
    userId: number;
    type: string;
    title: string;
    message: string;
    relatedTaskId?: number;
    relatedUserId?: number;
  }): SimpleNotification {
    const notification: SimpleNotification = {
      id: this.idCounter++,
      ...data,
      isRead: false,
      createdAt: new Date(),
    };
    this.notifications.set(notification.id, notification);
    return notification;
  }

  getUnreadForUser(userId: number): SimpleNotification[] {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.isRead)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getAllForUser(userId: number): SimpleNotification[] {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  markAsRead(id: number): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.isRead = true;
    }
  }

  markAllAsRead(userId: number): void {
    Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.isRead)
      .forEach(n => n.isRead = true);
  }
}

export const notificationManager = new NotificationManager();