import { storage } from "./storage";
import { NotificationType, UserRole, type User, type Task, type InsertNotification } from "@shared/schema";
import webpush from "web-push";
import { WebSocket } from "ws";

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:admin@papersley.com',
  'BOBGjAPwsmmYRwf_rjYt0JPqcJUi-kNh0Rn6O_qUFYWc-uJhrGJ8Z0KJVLhVC4WhCVBxoLMrixOjZLxNP8HPkQg',
  'xlGnncGtpaZa1oGFOMtvbY66XzV_uBcI0-C4A7QDLDQ'
);

// WebSocket connections map: userId -> WebSocket[]
const activeConnections = new Map<number, WebSocket[]>();

export function addWebSocketConnection(userId: number, ws: WebSocket) {
  if (!activeConnections.has(userId)) {
    activeConnections.set(userId, []);
  }
  activeConnections.get(userId)!.push(ws);
  
  ws.on('close', () => {
    const connections = activeConnections.get(userId);
    if (connections) {
      const index = connections.indexOf(ws);
      if (index > -1) {
        connections.splice(index, 1);
      }
      if (connections.length === 0) {
        activeConnections.delete(userId);
      }
    }
  });
}

export function removeWebSocketConnection(userId: number, ws: WebSocket) {
  const connections = activeConnections.get(userId);
  if (connections) {
    const index = connections.indexOf(ws);
    if (index > -1) {
      connections.splice(index, 1);
    }
    if (connections.length === 0) {
      activeConnections.delete(userId);
    }
  }
}

interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  taskId?: number;
  actionUserId?: number;
  metadata?: any;
  notificationId?: number;
}

async function sendRealTimeNotification(userId: number, notification: any) {
  const connections = activeConnections.get(userId);
  if (connections) {
    const payload = JSON.stringify({
      type: 'notification',
      data: notification
    });
    
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }
}

async function sendPushNotification(userId: number, payload: NotificationPayload) {
  try {
    const subscription = await storage.getPushSubscription(userId);
    if (subscription) {
      console.log(`[PUSH] Sending notification to user ${userId}:`, payload.title);
      
      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.message,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: {
          taskId: payload.taskId,
          type: payload.type,
          url: payload.taskId ? `/tasks?taskId=${payload.taskId}` : '/',
          notificationId: payload.notificationId,
          actionUserId: payload.actionUserId,
          timestamp: Date.now()
        },
        tag: payload.taskId ? `task-${payload.taskId}` : 'general',
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'View Task',
            icon: '/icon-32.png'
          },
          {
            action: 'mark-read',
            title: 'Mark as Read',
            icon: '/icon-32.png'
          }
        ]
      });

      const result = await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        },
        pushPayload,
        {
          TTL: 24 * 60 * 60, // 24 hours
          urgency: 'normal'
        }
      );
      
      console.log(`[PUSH] Notification sent successfully to user ${userId}`, result);
    } else {
      console.log(`[PUSH] No push subscription found for user ${userId}`);
    }
  } catch (error) {
    console.error(`[PUSH] Error sending notification to user ${userId}:`, error);
    
    // If subscription is invalid, remove it
    if ((error as any).statusCode === 410 || (error as any).statusCode === 404) {
      console.log(`[PUSH] Removing invalid subscription for user ${userId}`);
      await storage.deletePushSubscription(userId);
    }
  }
}

export async function createAndSendNotification(
  recipientUserIds: number[],
  payload: NotificationPayload
) {
  const notifications = [];
  
  for (const userId of recipientUserIds) {
    // Create notification in database
    const notificationData: InsertNotification = {
      userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      relatedTaskId: payload.taskId,
      relatedUserId: payload.actionUserId,
      isRead: false,
      metadata: payload.metadata
    };
    
    const notification = await storage.createNotification(notificationData);
    notifications.push(notification);
    
    // Add notification ID to payload for push notifications
    const enhancedPayload = {
      ...payload,
      notificationId: notification.id
    };
    
    // Send real-time notification via WebSocket
    await sendRealTimeNotification(userId, notification);
    
    // Send push notification with enhanced payload
    await sendPushNotification(userId, enhancedPayload);
  }
  
  return notifications;
}

export async function getRelevantUserIds(
  type: NotificationType,
  task: Task,
  actionUserId: number,
  salesPersonId?: number
): Promise<number[]> {
  const allUsers = await storage.getAllUsers();
  const relevantUserIds: number[] = [];
  
  // Always include superadmin (except if they're the one taking action)
  const superadmins = allUsers.filter(u => u.role === UserRole.SUPERADMIN && u.id !== actionUserId);
  relevantUserIds.push(...superadmins.map(u => u.id));
  
  switch (type) {
    case NotificationType.TASK_CREATED:
      // Notify team leads, writers, and superadmin (not other sales persons)
      const teamLeads = allUsers.filter(u => u.role === UserRole.TEAM_LEAD && u.id !== actionUserId);
      const writers = allUsers.filter(u => u.role === UserRole.WRITER && u.id !== actionUserId);
      relevantUserIds.push(...teamLeads.map(u => u.id));
      relevantUserIds.push(...writers.map(u => u.id));
      break;
      
    case NotificationType.TASK_ASSIGNED:
    case NotificationType.TASK_UNASSIGNED:
    case NotificationType.TASK_STATUS_CHANGED:
    case NotificationType.COMMENT_ADDED:
    case NotificationType.FILE_UPLOADED:
      // Notify relevant team lead, sales person, assigned writer, and superadmin
      if (task.assignedToId && task.assignedToId !== actionUserId) {
        relevantUserIds.push(task.assignedToId);
      }
      
      // Find team lead for the assigned user
      if (task.assignedToId) {
        const assignedUser = allUsers.find(u => u.id === task.assignedToId);
        if (assignedUser?.teamId) {
          const teamLeads = allUsers.filter(u => 
            u.role === UserRole.TEAM_LEAD && 
            u.teamId === assignedUser.teamId && 
            u.id !== actionUserId
          );
          relevantUserIds.push(...teamLeads.map(u => u.id));
        }
      }
      
      // Include the sales person who created the task
      if (salesPersonId && salesPersonId !== actionUserId) {
        relevantUserIds.push(salesPersonId);
      }
      break;
      
    case NotificationType.DEADLINE_REMINDER:
      // Notify assigned writer, team lead, sales person, and superadmin
      if (task.assignedToId) {
        relevantUserIds.push(task.assignedToId);
        
        const assignedUser = allUsers.find(u => u.id === task.assignedToId);
        if (assignedUser?.teamId) {
          const teamLeads = allUsers.filter(u => 
            u.role === UserRole.TEAM_LEAD && 
            u.teamId === assignedUser.teamId
          );
          relevantUserIds.push(...teamLeads.map(u => u.id));
        }
      }
      
      if (salesPersonId) {
        relevantUserIds.push(salesPersonId);
      }
      break;
  }
  
  // Remove duplicates and action user
  return Array.from(new Set(relevantUserIds)).filter(id => id !== actionUserId);
}

// Notification helper functions for different events
export async function notifyTaskCreated(task: Task, createdByUserId: number) {
  const relevantUserIds = await getRelevantUserIds(
    NotificationType.TASK_CREATED,
    task,
    createdByUserId
  );
  
  const createdByUser = await storage.getUser(createdByUserId);
  
  return createAndSendNotification(relevantUserIds, {
    type: NotificationType.TASK_CREATED,
    title: 'New Task Created',
    message: `${createdByUser?.username || 'Someone'} created a new task: Task #${task.id}: ${task.title}`,
    taskId: task.id,
    actionUserId: createdByUserId,
    metadata: { taskTitle: task.title }
  });
}

export async function notifyTaskAssigned(task: Task, assignedToUserId: number, assignedByUserId: number, salesPersonId?: number) {
  const relevantUserIds = await getRelevantUserIds(
    NotificationType.TASK_ASSIGNED,
    task,
    assignedByUserId,
    salesPersonId
  );
  
  const assignedToUser = await storage.getUser(assignedToUserId);
  const assignedByUser = await storage.getUser(assignedByUserId);
  
  return createAndSendNotification(relevantUserIds, {
    type: NotificationType.TASK_ASSIGNED,
    title: 'Task Assigned',
    message: `${assignedByUser?.username || 'Someone'} assigned "Task #${task.id}: ${task.title}" to ${assignedToUser?.username || 'someone'}`,
    taskId: task.id,
    actionUserId: assignedByUserId,
    metadata: { 
      taskTitle: task.title,
      assignedToUsername: assignedToUser?.username,
      assignedByUsername: assignedByUser?.username
    }
  });
}

export async function notifyTaskStatusChanged(task: Task, oldStatus: string, newStatus: string, changedByUserId: number, salesPersonId?: number) {
  const relevantUserIds = await getRelevantUserIds(
    NotificationType.TASK_STATUS_CHANGED,
    task,
    changedByUserId,
    salesPersonId
  );
  
  const changedByUser = await storage.getUser(changedByUserId);
  
  return createAndSendNotification(relevantUserIds, {
    type: NotificationType.TASK_STATUS_CHANGED,
    title: 'Task Status Updated',
    message: `${changedByUser?.username || 'Someone'} changed "Task #${task.id}: ${task.title}" status from ${oldStatus} to ${newStatus}`,
    taskId: task.id,
    actionUserId: changedByUserId,
    metadata: { 
      taskTitle: task.title,
      oldStatus,
      newStatus,
      changedByUsername: changedByUser?.username
    }
  });
}

export async function notifyCommentAdded(task: Task, commentContent: string, addedByUserId: number, salesPersonId?: number) {
  const relevantUserIds = await getRelevantUserIds(
    NotificationType.COMMENT_ADDED,
    task,
    addedByUserId,
    salesPersonId
  );
  
  const addedByUser = await storage.getUser(addedByUserId);
  
  return createAndSendNotification(relevantUserIds, {
    type: NotificationType.COMMENT_ADDED,
    title: 'New Comment',
    message: `${addedByUser?.username || 'Someone'} commented on "Task #${task.id}: ${task.title}": ${commentContent.substring(0, 100)}${commentContent.length > 100 ? '...' : ''}`,
    taskId: task.id,
    actionUserId: addedByUserId,
    metadata: { 
      taskTitle: task.title,
      commentContent: commentContent.substring(0, 200),
      addedByUsername: addedByUser?.username
    }
  });
}

export async function notifyFileUploaded(task: Task, fileName: string, uploadedByUserId: number, salesPersonId?: number) {
  const relevantUserIds = await getRelevantUserIds(
    NotificationType.FILE_UPLOADED,
    task,
    uploadedByUserId,
    salesPersonId
  );
  
  const uploadedByUser = await storage.getUser(uploadedByUserId);
  
  return createAndSendNotification(relevantUserIds, {
    type: NotificationType.FILE_UPLOADED,
    title: 'File Uploaded',
    message: `${uploadedByUser?.username || 'Someone'} uploaded "${fileName}" to task "Task #${task.id}: ${task.title}"`,
    taskId: task.id,
    actionUserId: uploadedByUserId,
    metadata: { 
      taskTitle: task.title,
      fileName,
      uploadedByUsername: uploadedByUser?.username
    }
  });
}

export async function notifyDeadlineReminder(task: Task, daysLeft: number, salesPersonId?: number) {
  const relevantUserIds = await getRelevantUserIds(
    NotificationType.DEADLINE_REMINDER,
    task,
    0, // No action user for deadline reminders
    salesPersonId
  );
  
  return createAndSendNotification(relevantUserIds, {
    type: NotificationType.DEADLINE_REMINDER,
    title: 'Deadline Reminder',
    message: `Task "Task #${task.id}: ${task.title}" deadline is in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
    taskId: task.id,
    metadata: { 
      taskTitle: task.title,
      daysLeft,
      deadline: task.deadline
    }
  });
}