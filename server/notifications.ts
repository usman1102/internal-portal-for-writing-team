import { storage } from "./storage";
import { User, Task, NotificationType, UserRole, InsertNotification } from "@shared/schema";

export class NotificationService {
  
  // Determine who should be notified for different actions
  private async getNotificationRecipients(
    type: NotificationType,
    task: Task,
    triggeredBy: User,
    oldTask?: Partial<Task>
  ): Promise<number[]> {
    const recipients = new Set<number>();
    const allUsers = await storage.getAllUsers();
    const superAdmins = allUsers.filter(u => u.role === UserRole.SUPERADMIN);
    
    // Superadmin always gets all notifications
    superAdmins.forEach(admin => recipients.add(admin.id));
    
    switch (type) {
      case NotificationType.TASK_CREATED:
        // Team leads, all writers, and superadmin (excluding other sales)
        allUsers.forEach(user => {
          if (user.id !== triggeredBy.id) {
            if (user.role === UserRole.TEAM_LEAD || 
                user.role === UserRole.WRITER ||
                user.role === UserRole.SUPERADMIN) {
              recipients.add(user.id);
            }
          }
        });
        break;
        
      case NotificationType.TASK_ASSIGNED:
      case NotificationType.TASK_UNASSIGNED:
      case NotificationType.TASK_STATUS_CHANGED:
      case NotificationType.TASK_DUE_DATE_CHANGED:
      case NotificationType.TASK_COMMENT_ADDED:
      case NotificationType.TASK_FILE_UPLOADED:
        // Relevant team lead, relevant sales person, assigned writer, superadmin
        allUsers.forEach(user => {
          if (user.id !== triggeredBy.id) {
            // Assigned writer
            if (task.assignedToId && user.id === task.assignedToId) {
              recipients.add(user.id);
            }
            // Sales person who created the task
            if (task.createdBy && user.id === task.createdBy) {
              recipients.add(user.id);
            }
            // Team lead of assigned writer
            if (task.assignedToId) {
              const assignedWriter = allUsers.find(u => u.id === task.assignedToId);
              if (assignedWriter?.teamId && user.teamId === assignedWriter.teamId && user.role === UserRole.TEAM_LEAD) {
                recipients.add(user.id);
              }
            }
          }
        });
        break;
    }
    
    return Array.from(recipients);
  }

  // Create notification message based on type
  private createNotificationMessage(
    type: NotificationType,
    task: Task,
    triggeredBy: User,
    oldValue?: any,
    newValue?: any
  ): { title: string; message: string } {
    const taskTitle = task.title || 'Task';
    const triggeredByName = triggeredBy.fullName || triggeredBy.username;

    switch (type) {
      case NotificationType.TASK_CREATED:
        return {
          title: 'New Task Created',
          message: `${triggeredByName} created a new task: "${taskTitle}"`
        };
        
      case NotificationType.TASK_ASSIGNED:
        return {
          title: 'Task Assigned',
          message: `${triggeredByName} assigned you to task: "${taskTitle}"`
        };
        
      case NotificationType.TASK_UNASSIGNED:
        return {
          title: 'Task Unassigned',
          message: `${triggeredByName} unassigned task: "${taskTitle}"`
        };
        
      case NotificationType.TASK_STATUS_CHANGED:
        return {
          title: 'Task Status Changed',
          message: `${triggeredByName} changed task "${taskTitle}" status from ${oldValue} to ${newValue}`
        };
        
      case NotificationType.TASK_DUE_DATE_CHANGED:
        return {
          title: 'Task Due Date Changed',
          message: `${triggeredByName} updated the due date for task: "${taskTitle}"`
        };
        
      case NotificationType.TASK_COMMENT_ADDED:
        return {
          title: 'New Comment Added',
          message: `${triggeredByName} added a comment to task: "${taskTitle}"`
        };
        
      case NotificationType.TASK_FILE_UPLOADED:
        return {
          title: 'File Uploaded',
          message: `${triggeredByName} uploaded a file to task: "${taskTitle}"`
        };
        
      default:
        return {
          title: 'Task Update',
          message: `${triggeredByName} updated task: "${taskTitle}"`
        };
    }
  }

  // Send notification to multiple users
  async sendNotification(
    type: NotificationType,
    task: Task,
    triggeredBy: User,
    oldValue?: any,
    newValue?: any
  ): Promise<void> {
    try {
      const recipients = await this.getNotificationRecipients(type, task, triggeredBy);
      const { title, message } = this.createNotificationMessage(type, task, triggeredBy, oldValue, newValue);
      
      // Create notifications for each recipient
      const notifications = recipients.map(userId => ({
        userId,
        type,
        title,
        message,
        relatedTaskId: task.id,
        triggeredBy: triggeredBy.id,
        isRead: false
      }));
      
      // Save notifications to database
      await Promise.all(
        notifications.map(notification => storage.createNotification(notification))
      );
      
      // Send push notifications
      await this.sendPushNotifications(recipients, title, message, task);
      
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Send push notifications to users
  private async sendPushNotifications(
    userIds: number[],
    title: string,
    message: string,
    task?: Task
  ): Promise<void> {
    // This would integrate with a push notification service
    // For now, we'll use the browser's Notification API via service worker
    const notificationData = {
      title,
      message,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: task ? `task-${task.id}` : 'general',
      data: {
        taskId: task?.id,
        url: task ? `/tasks?task=${task.id}` : '/tasks'
      }
    };
    
    // In a real implementation, you would send this to a push notification service
    // or store it for the frontend to pickup via WebSocket/SSE
    console.log(`Push notification sent to ${userIds.length} users:`, notificationData);
  }

  // Trigger notifications for task creation
  async notifyTaskCreated(task: Task, createdBy: User): Promise<void> {
    await this.sendNotification(NotificationType.TASK_CREATED, task, createdBy);
  }

  // Trigger notifications for task assignment
  async notifyTaskAssigned(task: Task, assignedBy: User): Promise<void> {
    await this.sendNotification(NotificationType.TASK_ASSIGNED, task, assignedBy);
  }

  // Trigger notifications for task unassignment
  async notifyTaskUnassigned(task: Task, unassignedBy: User): Promise<void> {
    await this.sendNotification(NotificationType.TASK_UNASSIGNED, task, unassignedBy);
  }

  // Trigger notifications for status change
  async notifyTaskStatusChanged(task: Task, changedBy: User, oldStatus: string, newStatus: string): Promise<void> {
    await this.sendNotification(NotificationType.TASK_STATUS_CHANGED, task, changedBy, oldStatus, newStatus);
  }

  // Trigger notifications for due date change
  async notifyTaskDueDateChanged(task: Task, changedBy: User): Promise<void> {
    await this.sendNotification(NotificationType.TASK_DUE_DATE_CHANGED, task, changedBy);
  }

  // Trigger notifications for comment added
  async notifyCommentAdded(task: Task, commentedBy: User): Promise<void> {
    await this.sendNotification(NotificationType.TASK_COMMENT_ADDED, task, commentedBy);
  }

  // Trigger notifications for file upload
  async notifyFileUploaded(task: Task, uploadedBy: User): Promise<void> {
    await this.sendNotification(NotificationType.TASK_FILE_UPLOADED, task, uploadedBy);
  }
}

export const notificationService = new NotificationService();