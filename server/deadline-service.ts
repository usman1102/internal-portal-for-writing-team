import { storage } from "./storage";
import { notificationService } from "./notification-service";

export class DeadlineService {
  // Check for upcoming deadlines and send reminders
  async checkDeadlines(): Promise<void> {
    try {
      const tasks = await storage.getAllTasks();
      const now = new Date();
      
      for (const task of tasks) {
        if (!task.deadline) continue;
        
        const deadline = new Date(task.deadline);
        const timeDiff = deadline.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // Send reminder for 2 days and 1 day before deadline
        if (daysLeft === 2 || daysLeft === 1) {
          // Check if we already sent a reminder for this deadline
          const notifications = await storage.getNotificationsByUser(task.assignedToId || 1);
          const existingReminder = notifications.find(n => 
            n.taskId === task.id && 
            n.type === 'deadline_reminder' &&
            n.message.includes(`${daysLeft} day`)
          );
          
          if (!existingReminder) {
            await notificationService.notifyDeadlineReminder(task, daysLeft);
          }
        }
      }
    } catch (error) {
      console.error('Error checking deadlines:', error);
    }
  }
  
  // Start the deadline checking service (runs every hour)
  startDeadlineChecker(): void {
    // Run immediately
    this.checkDeadlines();
    
    // Then run every hour
    setInterval(() => {
      this.checkDeadlines();
    }, 60 * 60 * 1000); // 1 hour in milliseconds
  }
}

export const deadlineService = new DeadlineService();