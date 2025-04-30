import { 
  users, 
  projects, 
  tasks, 
  files, 
  comments, 
  activities, 
  analytics,
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type Task,
  type InsertTask,
  type File,
  type InsertFile,
  type Comment,
  type InsertComment,
  type Activity,
  type InsertActivity,
  type Analytics,
  type InsertAnalytics,
  UserRole,
  TaskStatus
} from "@shared/schema";
import session from "express-session";
import { db, pool } from "./db";
import { eq, desc, asc, gt } from "drizzle-orm";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

// Define the Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined>;

  // Task methods
  getTask(id: number): Promise<Task | undefined>;
  getAllTasks(): Promise<Task[]>;
  getTasksByAssignee(userId: number): Promise<Task[]>;
  getTasksByProject(projectId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined>;

  // File methods
  getFile(id: number): Promise<File | undefined>;
  getFilesByTask(taskId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;

  // Comment methods
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByTask(taskId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;

  // Activity methods
  getActivity(id: number): Promise<Activity | undefined>;
  getAllActivities(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Analytics methods
  getAnalytics(period: string): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;

  // Session store
  sessionStore: session.Store;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...userData,
      role: userData.role as UserRole
    }).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(projectData).returning();
    return project;
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set(projectData)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTasksByAssignee(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.assignedToId, userId));
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values({
      ...taskData,
      status: taskData.status as TaskStatus || TaskStatus.NEW
    }).returning();
    return task;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    // If status is being updated to COMPLETED, add submission date
    if (taskData.status === TaskStatus.COMPLETED) {
      taskData.submissionDate = new Date();
    }
    
    const [updatedTask] = await db
      .update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  // File methods
  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async getFilesByTask(taskId: number): Promise<File[]> {
    return await db.select().from(files).where(eq(files.taskId, taskId));
  }

  async createFile(fileData: InsertFile): Promise<File> {
    const [file] = await db.insert(files).values(fileData).returning();
    return file;
  }

  // Comment methods
  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment;
  }

  async getCommentsByTask(taskId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.taskId, taskId))
      .orderBy(asc(comments.createdAt));
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(commentData).returning();
    return comment;
  }

  // Activity methods
  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  async getAllActivities(): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt));
  }

  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(activityData).returning();
    return activity;
  }

  // Analytics methods
  async getAnalytics(period: string): Promise<Analytics[]> {
    return await db
      .select()
      .from(analytics)
      .where(eq(analytics.period, period));
  }

  async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [analytic] = await db.insert(analytics).values(analyticsData).returning();
    return analytic;
  }
}

export const storage = new DatabaseStorage();
