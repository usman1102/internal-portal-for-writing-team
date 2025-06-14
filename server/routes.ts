import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTaskSchema, insertFileSchema, insertCommentSchema, insertActivitySchema, insertUserSchema, insertTeamSchema, insertProjectSchema, UserRole } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Users routes
  app.get("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      // Only superadmin and team leads can view all users
      if (req.user?.role !== UserRole.SUPERADMIN && req.user?.role !== UserRole.TEAM_LEAD) {
        return res.status(403).send("Unauthorized to view users");
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      // Check permissions for creating users
      const { role: newUserRole } = req.body;
      const currentUserRole = req.user?.role;
      
      // Only superadmin and team leads can create users
      if (currentUserRole !== UserRole.SUPERADMIN && currentUserRole !== UserRole.TEAM_LEAD) {
        return res.status(403).send("Unauthorized to create users");
      }
      
      // Team leads can only create writers and proofreaders
      if (currentUserRole === UserRole.TEAM_LEAD && 
          newUserRole !== UserRole.WRITER && 
          newUserRole !== UserRole.PROOFREADER) {
        return res.status(403).send("Team leads can only create writers or proofreaders");
      }
      
      // Only superadmin can create sales users
      if (newUserRole === UserRole.SALES && currentUserRole !== UserRole.SUPERADMIN) {
        return res.status(403).send("Only superadmin can create sales users");
      }
      
      // Only superadmin can create other superadmins
      if (newUserRole === UserRole.SUPERADMIN && currentUserRole !== UserRole.SUPERADMIN) {
        return res.status(403).send("Only superadmin can create other superadmins");
      }
      
      // Validate request body
      const validatedData = insertUserSchema.parse(req.body);
      
      // Hash the password before creating user
      const hashedPassword = await storage.hashPassword(validatedData.password);
      const userDataWithHashedPassword = {
        ...validatedData,
        password: hashedPassword
      };
      
      const user = await storage.createUser(userDataWithHashedPassword);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
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
      // Only superadmin and team leads can update users
      if (req.user?.role !== UserRole.SUPERADMIN && req.user?.role !== UserRole.TEAM_LEAD) {
        return res.status(403).send("Unauthorized to update users");
      }
      
      let updateData = { ...req.body };
      
      // If password is provided, hash it
      if (updateData.password && updateData.password.trim() !== "") {
        updateData.password = await storage.hashPassword(updateData.password);
      } else {
        // Remove password from update if not provided
        delete updateData.password;
      }
      
      // Check if username is being changed and if it already exists
      if (updateData.username) {
        const existingUser = await storage.getUserByUsername(updateData.username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).send("Username already exists");
        }
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).send("User not found");
      }
      
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/users/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const userId = parseInt(req.params.id);
      const currentUserRole = req.user?.role;
      
      // Only superadmin can delete users
      if (currentUserRole !== UserRole.SUPERADMIN) {
        return res.status(403).send("Only superadmin can delete users");
      }
      
      // Prevent superadmin from deleting themselves
      if (userId === req.user?.id) {
        return res.status(400).send("Cannot delete your own account");
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      await storage.deleteUser(userId);
      res.status(200).send("User deleted successfully");
    } catch (error) {
      next(error);
    }
  });

  // Tasks routes

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
      
      // Only superadmin and sales can create projects
      if (req.user?.role !== UserRole.SUPERADMIN && req.user?.role !== UserRole.SALES) {
        return res.status(403).send("Unauthorized to create projects");
      }
      
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

  app.patch("/api/projects/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const projectId = parseInt(req.params.id);
      
      // Only superadmin and sales can update projects
      if (req.user?.role !== UserRole.SUPERADMIN && req.user?.role !== UserRole.SALES) {
        return res.status(403).send("Unauthorized to update projects");
      }
      
      const updatedProject = await storage.updateProject(projectId, req.body);
      
      if (!updatedProject) {
        return res.status(404).send("Project not found");
      }
      
      res.json(updatedProject);
    } catch (error) {
      next(error);
    }
  });

  // Tasks routes
  app.get("/api/tasks", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const userRole = req.user?.role;
      
      // Writers only see tasks assigned to them
      if (userRole === UserRole.WRITER) {
        const tasks = await storage.getTasksByAssignee(req.user.id);
        return res.json(tasks);
      }
      
      // Sales users only see tasks they created
      if (userRole === UserRole.SALES) {
        const allTasks = await storage.getAllTasks();
        const salesTasks = allTasks.filter(task => task.assignedById === req.user.id);
        return res.json(salesTasks);
      }
      
      // Superadmin, Team Leads, and Proofreaders see all tasks
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/tasks", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const userRole = req.user?.role;
      
      // Only superadmin, team leads, and sales can create tasks
      if (userRole !== UserRole.SUPERADMIN && 
          userRole !== UserRole.TEAM_LEAD && 
          userRole !== UserRole.SALES) {
        return res.status(403).send("Unauthorized to create tasks");
      }
      
      // Validate request body
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        assignedById: req.user.id,
        projectId: null // Remove project reference
      });
      
      const task = await storage.createTask(validatedData);
      
      // Create activity entry for task creation
      await storage.createActivity({
        userId: req.user.id,
        taskId: task.id,
        projectId: null,
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
      
      const userRole = req.user?.role;
      
      // Check permissions based on role
      const isWriter = userRole === UserRole.WRITER;
      const isProofreader = userRole === UserRole.PROOFREADER;
      const isSales = userRole === UserRole.SALES;
      const isTeamLead = userRole === UserRole.TEAM_LEAD;
      const isSuperadmin = userRole === UserRole.SUPERADMIN;
      
      const isAssignedWriter = isWriter && task.assignedToId === req.user?.id;
      const isTaskCreator = isSales && task.assignedById === req.user?.id;
      
      // Permission check
      if (isWriter && !isAssignedWriter) {
        return res.status(403).send("Writers can only update their assigned tasks");
      }
      
      if (isSales && !isTaskCreator) {
        return res.status(403).send("Sales users can only update tasks they created");
      }
      
      // Determine what can be updated
      let updateData = req.body;
      
      if (isWriter) {
        // Writers can only update status
        updateData = { status: req.body.status };
      } else if (isProofreader) {
        // Proofreaders can only update status to COMPLETED or REVISION
        if (req.body.status && req.body.status !== 'COMPLETED' && req.body.status !== 'REVISION') {
          return res.status(403).send("Proofreaders can only mark tasks as COMPLETED or REVISION");
        }
        updateData = { status: req.body.status };
      } else if (isSales && isTaskCreator) {
        // Sales can update their own tasks fully
        updateData = req.body;
      } else if (isTeamLead || isSuperadmin) {
        // Team leads and superadmin can update any task
        updateData = req.body;
      } else {
        return res.status(403).send("Unauthorized to update this task");
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
          projectId: null,
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

  // Teams routes
  app.get("/api/teams", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      // Only superadmin and team leads can view teams
      if (req.user?.role !== UserRole.SUPERADMIN && req.user?.role !== UserRole.TEAM_LEAD) {
        return res.status(403).send("Unauthorized to view teams");
      }
      
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/teams", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      // Only superadmin can create teams
      if (req.user?.role !== UserRole.SUPERADMIN) {
        return res.status(403).send("Only superadmin can create teams");
      }
      
      const validatedData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/teams/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const teamId = parseInt(req.params.id);
      const existingTeam = await storage.getTeam(teamId);
      
      if (!existingTeam) {
        return res.status(404).send("Team not found");
      }
      
      // Only superadmin or the team lead can update team
      if (req.user?.role !== UserRole.SUPERADMIN && existingTeam.teamLeadId !== req.user?.id) {
        return res.status(403).send("Unauthorized to update this team");
      }
      
      const updatedTeam = await storage.updateTeam(teamId, req.body);
      if (!updatedTeam) {
        return res.status(404).send("Team not found");
      }
      
      res.json(updatedTeam);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/teams/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      // Only superadmin can delete teams
      if (req.user?.role !== UserRole.SUPERADMIN) {
        return res.status(403).send("Only superadmin can delete teams");
      }
      
      const teamId = parseInt(req.params.id);
      await storage.deleteTeam(teamId);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
