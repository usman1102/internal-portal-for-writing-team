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
  type InsertAnalytics
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

// In-memory storage implementation
export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private projectsData: Map<number, Project>;
  private tasksData: Map<number, Task>;
  private filesData: Map<number, File>;
  private commentsData: Map<number, Comment>;
  private activitiesData: Map<number, Activity>;
  private analyticsData: Map<number, Analytics>;
  sessionStore: session.Store;
  
  private userIdCounter: number;
  private projectIdCounter: number;
  private taskIdCounter: number;
  private fileIdCounter: number;
  private commentIdCounter: number;
  private activityIdCounter: number;
  private analyticsIdCounter: number;

  constructor() {
    this.usersData = new Map();
    this.projectsData = new Map();
    this.tasksData = new Map();
    this.filesData = new Map();
    this.commentsData = new Map();
    this.activitiesData = new Map();
    this.analyticsData = new Map();
    
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.taskIdCounter = 1;
    this.fileIdCounter = 1;
    this.commentIdCounter = 1;
    this.activityIdCounter = 1;
    this.analyticsIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...userData, id };
    this.usersData.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersData.values());
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projectsData.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projectsData.values());
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const project: Project = { ...projectData, id };
    this.projectsData.set(id, project);
    return project;
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const project = await this.getProject(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...projectData };
    this.projectsData.set(id, updatedProject);
    return updatedProject;
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasksData.get(id);
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasksData.values());
  }

  async getTasksByAssignee(userId: number): Promise<Task[]> {
    return Array.from(this.tasksData.values())
      .filter(task => task.assignedToId === userId);
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    return Array.from(this.tasksData.values())
      .filter(task => task.projectId === projectId);
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();
    const task: Task = { 
      ...taskData, 
      id, 
      createdAt: now
    };
    this.tasksData.set(id, task);
    return task;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const task = await this.getTask(id);
    if (!task) return undefined;
    
    // If status is being updated to COMPLETED, add submission date
    if (taskData.status === 'COMPLETED' && task.status !== 'COMPLETED') {
      taskData.submissionDate = new Date();
    }
    
    const updatedTask = { ...task, ...taskData };
    this.tasksData.set(id, updatedTask);
    return updatedTask;
  }

  // File methods
  async getFile(id: number): Promise<File | undefined> {
    return this.filesData.get(id);
  }

  async getFilesByTask(taskId: number): Promise<File[]> {
    return Array.from(this.filesData.values())
      .filter(file => file.taskId === taskId);
  }

  async createFile(fileData: InsertFile): Promise<File> {
    const id = this.fileIdCounter++;
    const now = new Date();
    const file: File = { 
      ...fileData, 
      id, 
      uploadedAt: now
    };
    this.filesData.set(id, file);
    return file;
  }

  // Comment methods
  async getComment(id: number): Promise<Comment | undefined> {
    return this.commentsData.get(id);
  }

  async getCommentsByTask(taskId: number): Promise<Comment[]> {
    return Array.from(this.commentsData.values())
      .filter(comment => comment.taskId === taskId);
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const now = new Date();
    const comment: Comment = { 
      ...commentData, 
      id, 
      createdAt: now
    };
    this.commentsData.set(id, comment);
    return comment;
  }

  // Activity methods
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activitiesData.get(id);
  }

  async getAllActivities(): Promise<Activity[]> {
    return Array.from(this.activitiesData.values())
      .sort((a, b) => {
        // Sort by createdAt in descending order (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const now = new Date();
    const activity: Activity = { 
      ...activityData, 
      id, 
      createdAt: now
    };
    this.activitiesData.set(id, activity);
    return activity;
  }

  // Analytics methods
  async getAnalytics(period: string): Promise<Analytics[]> {
    return Array.from(this.analyticsData.values())
      .filter(analytics => analytics.period === period);
  }

  async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const id = this.analyticsIdCounter++;
    const now = new Date();
    const analytics: Analytics = { 
      ...analyticsData, 
      id, 
      createdAt: now
    };
    this.analyticsData.set(id, analytics);
    return analytics;
  }
}

export const storage = new MemStorage();
