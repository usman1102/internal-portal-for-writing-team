import { 
  users, 
  tasks, 
  files, 
  comments, 
  activities, 
  teams,
  type User, 
  type InsertUser,
  type Task,
  type InsertTask,
  type File,
  type InsertFile,
  type Comment,
  type InsertComment,
  type Activity,
  type InsertActivity,
  type Team,
  type InsertTeam,
  UserRole,
  TaskStatus
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

// Define the Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  hashPassword(password: string): Promise<string>;



  // Task methods
  getTask(id: number): Promise<Task | undefined>;
  getAllTasks(): Promise<Task[]>;
  getTasksByAssignee(userId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined>;

  // File methods
  getFile(id: number): Promise<File | undefined>;
  getFilesByTask(taskId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number): Promise<void>;

  // Comment methods
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByTask(taskId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;

  // Activity methods
  getActivity(id: number): Promise<Activity | undefined>;
  getAllActivities(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;



  // Team methods
  getTeam(id: number): Promise<Team | undefined>;
  getAllTeams(): Promise<Team[]>;
  getTeamsByLeader(teamLeadId: number): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<void>;

  // Session store
  sessionStore: session.Store;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private tasksData: Map<number, Task>;
  private filesData: Map<number, File>;
  private commentsData: Map<number, Comment>;
  private activitiesData: Map<number, Activity>;

  private teamsData: Map<number, Team>;
  sessionStore: session.Store;
  
  private userIdCounter: number;
  private taskIdCounter: number;
  private fileIdCounter: number;
  private commentIdCounter: number;
  private activityIdCounter: number;

  private teamIdCounter: number;

  constructor() {
    this.usersData = new Map();
    this.tasksData = new Map();
    this.filesData = new Map();
    this.commentsData = new Map();
    this.activitiesData = new Map();

    this.teamsData = new Map();
    
    this.userIdCounter = 1;
    this.taskIdCounter = 1;
    this.fileIdCounter = 1;
    this.commentIdCounter = 1;
    this.activityIdCounter = 1;

    this.teamIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });

    // Create default superadmin user
    this.createDefaultUsers();
    

    
    // Migrate existing plaintext passwords
    this.migrateExistingPasswords();
  }

  private async createDefaultUsers() {
    // Create superadmin user with password 'admin123'
    const hashedPassword = await this.hashPassword('admin123');
    const superadmin: User = {
      id: this.userIdCounter++,
      username: 'superadmin',
      password: hashedPassword,
      fullName: 'Super Administrator',
      email: 'superadmin@writepro.com',
      role: UserRole.SUPERADMIN,
      status: 'ACTIVE',
      teamId: null,
      dateOfBirth: null,
      city: null,
      degree: null,
      theme: "light"
    };
    this.usersData.set(superadmin.id, superadmin);
  }

  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }

  private async migrateExistingPasswords() {
    // Check if any users have plaintext passwords and hash them
    for (const user of Array.from(this.usersData.values())) {
      // Check if password is plaintext (doesn't contain a dot separator)
      if (!user.password.includes('.')) {
        const hashedPassword = await this.hashPassword(user.password);
        const updatedUser = { ...user, password: hashedPassword };
        this.usersData.set(user.id, updatedUser);
        console.log(`Migrated password for user: ${user.username}`);
      }
    }
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
    const user = { ...userData, id } as User;
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

  async deleteUser(id: number): Promise<void> {
    this.usersData.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersData.values());
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



  async createTask(taskData: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();
    const task = { 
      ...taskData, 
      id, 
      createdAt: now,
      assignedToId: null, // Ensure tasks start unassigned
      status: TaskStatus.NEW
    } as Task;
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
    const file = { 
      ...fileData, 
      id, 
      uploadedAt: now
    } as File;
    this.filesData.set(id, file);
    return file;
  }

  async deleteFile(id: number): Promise<void> {
    this.filesData.delete(id);
  }

  // Comment methods
  async getComment(id: number): Promise<Comment | undefined> {
    return this.commentsData.get(id);
  }

  async getCommentsByTask(taskId: number): Promise<Comment[]> {
    return Array.from(this.commentsData.values())
      .filter(comment => comment.taskId === taskId)
      .sort((a, b) => {
        // Sort by createdAt in ascending order (oldest first)
        if (!a.createdAt || !b.createdAt) return 0;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const now = new Date();
    const comment = { 
      ...commentData, 
      id, 
      createdAt: now
    } as Comment;
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
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const now = new Date();
    const activity = { 
      ...activityData, 
      id, 
      createdAt: now
    } as Activity;
    this.activitiesData.set(id, activity);
    return activity;
  }



  // Team methods
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teamsData.get(id);
  }

  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teamsData.values());
  }

  async getTeamsByLeader(teamLeadId: number): Promise<Team[]> {
    return Array.from(this.teamsData.values()).filter(team => team.teamLeadId === teamLeadId);
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    const id = this.teamIdCounter++;
    const now = new Date();
    const team = { 
      ...teamData, 
      id, 
      createdAt: now
    } as Team;
    this.teamsData.set(id, team);
    return team;
  }

  async updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined> {
    const existingTeam = this.teamsData.get(id);
    if (!existingTeam) return undefined;

    const updatedTeam = { ...existingTeam, ...teamData };
    this.teamsData.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<void> {
    this.teamsData.delete(id);
  }
}

export const storage = new MemStorage();