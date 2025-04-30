import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTaskSchema, insertProjectSchema, insertFileSchema, insertCommentSchema, insertActivitySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Users routes
  app.get("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/users/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/users/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const userId = parseInt(req.params.id);
      // Only team leads and sales can update user status
      if (req.user?.role !== 'TEAM_LEAD' && req.user?.role !== 'SALES') {
        return res.status(403).send("Unauthorized to update user status");
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(404).send("User not found");
      }
      
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });

  // Projects routes
  app.get("/api/projects", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/projects", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      // Only team leads and sales can create projects
      if (req.user?.role !== 'TEAM_LEAD' && req.user?.role !== 'SALES') {
        return res.status(403).send("Unauthorized to create projects");
      }
      
      // Validate request body
      const validatedData = insertProjectSchema.parse(req.body);
      
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      next(error);
    }
  });
  
  app.get("/api/projects/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).send("Project not found");
      }
      
      res.json(project);
    } catch (error) {
      next(error);
    }
  });

  // Tasks routes
  app.get("/api/tasks", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      // If the user is a writer, only show tasks assigned to them
      if (req.user?.role === 'WRITER') {
        const tasks = await storage.getTasksByAssignee(req.user.id);
        return res.json(tasks);
      }
      
      // For all other roles, show all tasks
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/tasks", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      // Only team leads and sales can create tasks
      if (req.user?.role !== 'TEAM_LEAD' && req.user?.role !== 'SALES') {
        return res.status(403).send("Unauthorized to create tasks");
      }
      
      // Validate request body
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        assignedById: req.user.id
      });
      
      const task = await storage.createTask(validatedData);
      
      // Create activity entry for task creation
      await storage.createActivity({
        userId: req.user.id,
        taskId: task.id,
        projectId: task.projectId,
        action: 'TASK_CREATED',
        description: `${req.user.fullName} created a new task: ${task.title}`
      });
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      next(error);
    }
  });
  
  app.get("/api/tasks/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).send("Task not found");
      }
      
      // Writers can only access tasks assigned to them
      if (req.user?.role === 'WRITER' && task.assignedToId !== req.user.id) {
        return res.status(403).send("Unauthorized to access this task");
      }
      
      res.json(task);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/tasks/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).send("Task not found");
      }
      
      // Check permissions
      const isWriter = req.user?.role === 'WRITER';
      const isProofreader = req.user?.role === 'PROOFREADER';
      const isAssignedWriter = isWriter && task.assignedToId === req.user?.id;
      const canEditTask = !isWriter || isAssignedWriter;
      
      if (!canEditTask) {
        return res.status(403).send("Unauthorized to update this task");
      }
      
      // Writers can only update status, not other fields
      let updateData = req.body;
      if (isWriter) {
        updateData = { status: req.body.status };
      }
      
      // Proofreaders can only update status to COMPLETED or REVISION
      if (isProofreader) {
        if (req.body.status !== 'COMPLETED' && req.body.status !== 'REVISION') {
          return res.status(403).send("Proofreaders can only mark tasks as COMPLETED or REVISION");
        }
        updateData = { status: req.body.status };
      }
      
      const updatedTask = await storage.updateTask(taskId, updateData);
      
      // Create activity entry for status change if that's what was updated
      if (req.body.status && req.body.status !== task.status) {
        let action = 'STATUS_UPDATED';
        if (req.body.status === 'REVIEW') action = 'SUBMISSION';
        if (req.body.status === 'COMPLETED') action = 'APPROVAL';
        if (req.body.status === 'REVISION') action = 'REVISION';
        
        await storage.createActivity({
          userId: req.user.id,
          taskId: taskId,
          projectId: task.projectId,
          action,
          description: `${req.user.fullName} changed task status to ${req.body.status}: ${task.title}`
        });
      }
      
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  });

  // Files routes
  app.post("/api/files", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      // Validate request body
      const validatedData = insertFileSchema.parse({
        ...req.body,
        uploadedById: req.user.id
      });
      
      // Check if the task exists and the user has access to it
      const task = await storage.getTask(validatedData.taskId);
      
      if (!task) {
        return res.status(404).send("Task not found");
      }
      
      // Writers can only upload files to their assigned tasks
      if (req.user?.role === 'WRITER' && task.assignedToId !== req.user.id) {
        return res.status(403).send("Unauthorized to upload files to this task");
      }
      
      const file = await storage.createFile(validatedData);
      
      res.status(201).json(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      next(error);
    }
  });
  
  app.get("/api/files/:taskId", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const taskId = parseInt(req.params.taskId);
      
      // Check if the task exists and the user has access to it
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).send("Task not found");
      }
      
      // Writers can only access files for their assigned tasks
      if (req.user?.role === 'WRITER' && task.assignedToId !== req.user.id) {
        return res.status(403).send("Unauthorized to access files for this task");
      }
      
      const files = await storage.getFilesByTask(taskId);
      res.json(files);
    } catch (error) {
      next(error);
    }
  });

  // Comments routes
  app.post("/api/comments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      // Validate request body
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if the task exists and the user has access to it
      const task = await storage.getTask(validatedData.taskId);
      
      if (!task) {
        return res.status(404).send("Task not found");
      }
      
      // Writers can only comment on their assigned tasks
      if (req.user?.role === 'WRITER' && task.assignedToId !== req.user.id) {
        return res.status(403).send("Unauthorized to comment on this task");
      }
      
      const comment = await storage.createComment(validatedData);
      
      // Create activity for the comment
      await storage.createActivity({
        userId: req.user.id,
        taskId: task.id,
        projectId: task.projectId,
        action: 'COMMENT_ADDED',
        description: `${req.user.fullName} commented on: ${task.title}`
      });
      
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      next(error);
    }
  });
  
  app.get("/api/comments/:taskId", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const taskId = parseInt(req.params.taskId);
      
      // Check if the task exists and the user has access to it
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).send("Task not found");
      }
      
      // Writers can only access comments for their assigned tasks
      if (req.user?.role === 'WRITER' && task.assignedToId !== req.user.id) {
        return res.status(403).send("Unauthorized to access comments for this task");
      }
      
      const comments = await storage.getCommentsByTask(taskId);
      res.json(comments);
    } catch (error) {
      next(error);
    }
  });

  // Activities routes
  app.get("/api/activities", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const activities = await storage.getAllActivities();
      res.json(activities);
    } catch (error) {
      next(error);
    }
  });

  // Analytics routes
  app.get("/api/analytics", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      // Only team leads and sales can access analytics
      if (req.user?.role !== 'TEAM_LEAD' && req.user?.role !== 'SALES') {
        return res.status(403).send("Unauthorized to access analytics");
      }
      
      const period = req.query.period as string || '7days';
      const analytics = await storage.getAnalytics(period);
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
