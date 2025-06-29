import { storage } from "./storage";
import { UserRole, type User, type Task, type InsertNotification } from "../shared/schema";

export class NotificationService {
  // Helper to get users who should receive task creation notifications
  private async getTaskCreationRecipients(excludeUserId?: number): Promise<User[]> {
    const allUsers = await storage.getAllUsers();
    return allUsers.filter(user => 
      user.id !== excludeUserId && 
      (user.role === UserRole.SUPERADMIN || 
       user.role === UserRole.TEAM_LEAD || 
       user.role === UserRole.WRITER)
    );
  }

  // Helper to get relevant users for task updates
  private async getTaskUpdateRecipients(task: Task, excludeUserId?: number): Promise<User[]> {
    const allUsers = await storage.getAllUsers();
    const recipients: User[] = [];

    // Always include superadmin
    const superadmins = allUsers.filter(user => user.role === UserRole.SUPERADMIN && user.id !== excludeUserId);
    recipients.push(...superadmins);

    // Include task creator (sales person)
    if (task.assignedById && task.assignedById !== excludeUserId) {
      const creator = allUsers.find(user => user.id === task.assignedById);
      if (creator) recipients.push(creator);
    }

    // Include assigned user (writer/proofreader)
    if (task.assignedToId && task.assignedToId !== excludeUserId) {
      const assignedUser = allUsers.find(user => user.id === task.assignedToId);
      if (assignedUser) recipients.push(assignedUser);
    }

    // Include relevant team lead
    if (task.assignedToId) {
      const assignedUser = allUsers.find(user => user.id === task.assignedToId);
      if (assignedUser?.teamId) {
        const allTeams = await storage.getAllTeams();
        const team = allTeams.find(t => t.id === assignedUser.teamId);
        if (team?.teamLeadId && team.teamLeadId !== excludeUserId) {
          const teamLead = allUsers.find(user => user.id === team.teamLeadId);
          if (teamLead && !recipients.find(r => r.id === teamLead.id)) {
            recipients.push(teamLead);
          }
        }
      }
    }

    return recipients;
  }

  // Send notification for new task creation
  async notifyTaskCreated(task: Task, createdByUserId: number): Promise<void> {
    const recipients = await this.getTaskCreationRecipients(createdByUserId);
    
    for (const recipient of recipients) {
      await storage.createNotification({
        userId: recipient.id,
        title: "New Task Created",
        message: `Task #${task.id}: "${task.title}" has been created`,
        type: "task_created",
        taskId: task.id,
        triggeredByUserId: createdByUserId,
        isRead: false
      });
    }
  }

  // Send notification for task assignment
  async notifyTaskAssigned(task: Task, assignedByUserId: number): Promise<void> {
    const recipients = await this.getTaskUpdateRecipients(task, assignedByUserId);
    
    for (const recipient of recipients) {
      await storage.createNotification({
        userId: recipient.id,
        title: "Task Assigned",
        message: `Task #${task.id}: "${task.title}" has been assigned`,
        type: "task_assigned",
        taskId: task.id,
        triggeredByUserId: assignedByUserId,
        isRead: false
      });
    }
  }

  // Send notification for task status change
  async notifyTaskStatusChanged(task: Task, newStatus: string, changedByUserId: number): Promise<void> {
    const recipients = await this.getTaskUpdateRecipients(task, changedByUserId);
    
    for (const recipient of recipients) {
      await storage.createNotification({
        userId: recipient.id,
        title: "Task Status Updated",
        message: `Task #${task.id}: "${task.title}" status changed to ${newStatus.replace('_', ' ')}`,
        type: "task_status_changed",
        taskId: task.id,
        triggeredByUserId: changedByUserId,
        isRead: false
      });
    }
  }

  // Send notification for new comment
  async notifyCommentAdded(task: Task, commentedByUserId: number): Promise<void> {
    const recipients = await this.getTaskUpdateRecipients(task, commentedByUserId);
    
    for (const recipient of recipients) {
      await storage.createNotification({
        userId: recipient.id,
        title: "New Comment Added",
        message: `New comment added to Task #${task.id}: "${task.title}"`,
        type: "comment_added",
        taskId: task.id,
        triggeredByUserId: commentedByUserId,
        isRead: false
      });
    }
  }

  // Send notification for file upload
  async notifyFileUploaded(task: Task, fileName: string, uploadedByUserId: number): Promise<void> {
    const recipients = await this.getTaskUpdateRecipients(task, uploadedByUserId);
    
    for (const recipient of recipients) {
      await storage.createNotification({
        userId: recipient.id,
        title: "File Uploaded",
        message: `File "${fileName}" uploaded to Task #${task.id}: "${task.title}"`,
        type: "file_uploaded",
        taskId: task.id,
        triggeredByUserId: uploadedByUserId,
        isRead: false
      });
    }
  }

  // Send deadline reminder notifications
  async notifyDeadlineReminder(task: Task, daysLeft: number): Promise<void> {
    const recipients = await this.getTaskUpdateRecipients(task);
    
    for (const recipient of recipients) {
      await storage.createNotification({
        userId: recipient.id,
        title: "Deadline Reminder",
        message: `Task #${task.id}: "${task.title}" is due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
        type: "deadline_reminder",
        taskId: task.id,
        triggeredByUserId: null,
        isRead: false
      });
    }
  }
}

export const notificationService = new NotificationService();