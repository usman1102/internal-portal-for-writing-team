import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTaskSchema, insertFileSchema, insertCommentSchema, insertActivitySchema, insertUserSchema, insertTeamSchema, UserRole } from "@shared/schema";
import { z } from "zod";


export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Users routes
  app.get("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const users = await storage.getAllUsers();
      
      // Filter users based on role permissions
      if (req.user?.role === UserRole.SUPERADMIN) {
        // Superadmin can see all users
        res.json(users);
      } else if (req.user?.role === UserRole.TEAM_LEAD) {
        // Team leads can see all users (existing behavior)
        res.json(users);
      } else if (req.user?.role === UserRole.WRITER || req.user?.role === UserRole.PROOFREADER) {
        // Writers and proofreaders can see basic info of all users for task assignments
        // but hide sensitive data like passwords
        const filteredUsers = users.map(user => ({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          teamId: user.teamId
        }));
        res.json(filteredUsers);
      } else if (req.user?.role === UserRole.SALES) {
        // Sales users can see basic info of users to display task assignments
        // but hide sensitive data like passwords
        const filteredUsers = users.map(user => ({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          teamId: user.teamId
        }));
        res.json(filteredUsers);
      } else {
        // Other roles don't need to see users
        return res.status(403).send("Unauthorized to view users");
      }
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
      // Users can update their own profile, or superadmin/team leads can update others
      if (req.user?.id !== userId && req.user?.role !== UserRole.SUPERADMIN && req.user?.role !== UserRole.TEAM_LEAD) {
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



  // Tasks routes
  app.get("/api/tasks", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const userRole = req.user?.role;
      
      // Writers see tasks assigned to them AND unassigned tasks
      if (userRole === UserRole.WRITER) {
        const allTasks = await storage.getAllTasks();
        const writerTasks = allTasks.filter(task => 
          task.assignedToId === req.user.id || task.assignedToId === null
        );
        return res.json(writerTasks);
      }
      
      // Sales users see tasks they created AND tasks assigned to writers in their organization
      if (userRole === UserRole.SALES) {
        const allTasks = await storage.getAllTasks();
        // Sales see all tasks they created, regardless of assignment status
        const salesTasks = allTasks.filter(task => task.assignedById === req.user.id);
        console.log(`Sales user ${req.user.username} tasks:`, 
          salesTasks.map(t => `Task ${t.id}: "${t.title}" assigned to ${t.assignedToId || 'unassigned'}`));
        return res.json(salesTasks);
      }
      
      // Proofreaders see tasks assigned to them AND unassigned tasks
      if (userRole === UserRole.PROOFREADER) {
        const allTasks = await storage.getAllTasks();
        const proofreaderTasks = allTasks.filter(task => 
          task.assignedToId === req.user.id || task.assignedToId === null
        );
        return res.json(proofreaderTasks);
      }
      
      // Team Leads see unassigned tasks AND tasks assigned to their team members
      if (userRole === UserRole.TEAM_LEAD) {
        const allTasks = await storage.getAllTasks();
        const allUsers = await storage.getAllUsers();
        const allTeams = await storage.getAllTeams();
        
        // Find the team where this user is the team lead
        const teamLedByUser = allTeams.find(team => team.teamLeadId === req.user.id);
        
        if (teamLedByUser) {
          // Get team members (users with the same teamId as the team led by this user)
          const teamMembers = allUsers.filter(user => 
            user.teamId === teamLedByUser.id && user.id !== req.user.id
          );
          const teamMemberIds = teamMembers.map(member => member.id);
          
          console.log(`Team Lead ${req.user.username} leads team ${teamLedByUser.name} (id: ${teamLedByUser.id})`);
          console.log('Team members:', teamMembers.map(m => `${m.username} (id: ${m.id})`));
          console.log('Team member IDs:', teamMemberIds);
          
          const teamLeadTasks = allTasks.filter(task => 
            task.assignedToId === null || // Unassigned tasks
            teamMemberIds.includes(task.assignedToId!) // Tasks assigned to team members
          );
          
          console.log('Filtered tasks for team lead:', teamLeadTasks.map(t => `Task ${t.id} assigned to ${t.assignedToId}`));
          return res.json(teamLeadTasks);
        } else {
          // If no team found, just return unassigned tasks
          const unassignedTasks = allTasks.filter(task => task.assignedToId === null);
          console.log(`Team Lead ${req.user.username} has no team, showing unassigned tasks only`);
          return res.json(unassignedTasks);
        }
      }
      
      // Superadmin sees all tasks
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
      
      // Extract files array from request body
      const { files, ...taskData } = req.body;
      
      // Validate request body
      const validatedData = insertTaskSchema.parse({
        ...taskData,
        assignedById: req.user.id
      });
      
      const task = await storage.createTask(validatedData);
      
      // Handle file uploads if any files were attached
      if (files && Array.isArray(files) && files.length > 0) {
        for (const fileInfo of files) {
          try {
            // Create file record in database
            await storage.createFile({
              taskId: task.id,
              uploadedById: req.user.id,
              fileName: fileInfo.name,
              fileSize: fileInfo.size,
              fileType: fileInfo.type,
              fileContent: `placeholder-content-${fileInfo.name}`, // This will be updated when we implement proper file upload
              category: 'INSTRUCTION', // Files uploaded during task creation are instruction files
              isSubmission: false
            });
          } catch (fileError) {
            console.error('Error saving file info:', fileError);
            // Continue with other files even if one fails
          }
        }
      }
      
      // Create activity entry for task creation
      await storage.createActivity({
        userId: req.user.id,
        taskId: task.id,
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
          action,
          description: `${req.user.fullName} changed task status to ${req.body.status}: ${task.title}`
        });


      }
      
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  });

  // Delete task route
  app.delete("/api/tasks/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const taskId = parseInt(req.params.id);
      
      if (isNaN(taskId)) {
        return res.status(400).send("Invalid task ID");
      }
      
      // Get the task to check permissions
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).send("Task not found");
      }
      
      const userRole = req.user?.role;
      const isTaskCreator = task.assignedById === req.user?.id;
      const isSuperadmin = userRole === UserRole.SUPERADMIN;
      const isTeamLead = userRole === UserRole.TEAM_LEAD;
      const isSales = userRole === UserRole.SALES;
      
      // Permission check: superadmin, team leads, or sales who created the task
      const canDeleteTask = isSuperadmin || isTeamLead || (isSales && isTaskCreator);
      
      if (!canDeleteTask) {
        return res.status(403).send("Unauthorized to delete this task");
      }
      
      await storage.deleteTask(taskId);
      res.status(200).send("Task deleted successfully");
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
      
      // Validate task ID
      if (!validatedData.taskId || isNaN(validatedData.taskId)) {
        return res.status(400).send("Invalid task ID");
      }
      
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
      
      if (isNaN(taskId)) {
        return res.status(400).send("Invalid task ID");
      }
      
      // Check if the task exists and the user has access to it
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).send("Task not found");
      }
      
      // Writers can access files for their assigned tasks, plus instruction files for any task
      if (req.user?.role === 'WRITER' && task.assignedToId !== req.user.id) {
        // Allow access but filter to only instruction files
        const files = await storage.getFilesByTask(taskId);
        const instructionFiles = files.filter(file => file.category === 'INSTRUCTION');
        return res.json(instructionFiles);
      }
      
      const files = await storage.getFilesByTask(taskId);
      res.json(files);
    } catch (error) {
      next(error);
    }
  });

  // Download file route
  app.get("/api/files/download/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const fileId = parseInt(req.params.id);
      
      if (isNaN(fileId)) {
        return res.status(400).send("Invalid file ID");
      }
      
      // Get the file
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).send("File not found");
      }
      
      // Check if the task exists and the user has access to it
      if (!file.taskId) {
        return res.status(400).send("Invalid task ID in file record");
      }
      
      const task = await storage.getTask(file.taskId);
      
      if (!task) {
        return res.status(404).send("Task not found");
      }
      
      // Writers can download files for their assigned tasks, plus instruction files for any task
      if (req.user?.role === 'WRITER' && task.assignedToId !== req.user.id && file.category !== 'INSTRUCTION') {
        return res.status(403).send("Unauthorized to download files for this task");
      }
      
      // Decode base64 content
      const fileBuffer = Buffer.from(file.fileContent, 'base64');
      
      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
      res.setHeader('Content-Type', file.fileType || 'application/octet-stream');
      res.setHeader('Content-Length', fileBuffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Send the file buffer
      res.end(fileBuffer);
    } catch (error) {
      next(error);
    }
  });

  // Delete file route
  app.delete("/api/files/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const fileId = parseInt(req.params.id);
      
      if (isNaN(fileId)) {
        return res.status(400).send("Invalid file ID");
      }
      
      // Get the file to check permissions
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).send("File not found");
      }
      
      // Check if the task exists and the user has permission to delete files
      if (!file.taskId) {
        return res.status(400).send("Invalid task ID in file record");
      }
      
      const task = await storage.getTask(file.taskId);
      
      if (!task) {
        return res.status(404).send("Task not found");
      }
      
      const userRole = req.user?.role;
      const isTaskAssignee = task.assignedToId === req.user?.id;
      const isFileUploader = file.uploadedById === req.user?.id;
      const isSuperadmin = userRole === UserRole.SUPERADMIN;
      const isSales = userRole === UserRole.SALES;
      const isTeamLead = userRole === UserRole.TEAM_LEAD;
      
      // Permission check: superadmin, sales, team leads, or file uploader (writers/proofreaders for their own files)
      const canDeleteFile = isSuperadmin || isSales || isTeamLead || 
                           (isTaskAssignee && isFileUploader && 
                            (userRole === UserRole.WRITER || userRole === UserRole.PROOFREADER));
      
      if (!canDeleteFile) {
        return res.status(403).send("Unauthorized to delete this file");
      }
      
      await storage.deleteFile(fileId);
      res.status(200).send("File deleted successfully");
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
      
      // Validate task ID
      if (!validatedData.taskId || isNaN(validatedData.taskId)) {
        return res.status(400).send("Invalid task ID");
      }
      
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
      
      if (isNaN(taskId)) {
        return res.status(400).send("Invalid task ID");
      }
      
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



  // Fix existing team leads' teamId - temporary endpoint
  app.post("/api/fix-team-leads", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      // Only superadmin can run this fix
      if (req.user?.role !== UserRole.SUPERADMIN) {
        return res.status(403).send("Only superadmin can run this fix");
      }
      
      const teams = await storage.getAllTeams();
      const fixes = [];
      
      for (const team of teams) {
        if (team.teamLeadId) {
          const teamLead = await storage.getUser(team.teamLeadId);
          if (teamLead && teamLead.teamId !== team.id) {
            await storage.updateUser(team.teamLeadId, { teamId: team.id });
            fixes.push(`Updated team lead ${teamLead.username} (ID: ${teamLead.id}) to team ${team.id}`);
          }
        }
      }
      
      res.json({ message: "Team leads fixed", fixes });
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
      
      // Automatically assign the team lead to their team
      if (validatedData.teamLeadId) {
        await storage.updateUser(validatedData.teamLeadId, { teamId: team.id });
      }
      
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
      
      // If team lead is being changed, update the new team lead's teamId
      if (req.body.teamLeadId && req.body.teamLeadId !== existingTeam.teamLeadId) {
        await storage.updateUser(req.body.teamLeadId, { teamId: teamId });
        
        // Remove old team lead from team if they exist
        if (existingTeam.teamLeadId) {
          await storage.updateUser(existingTeam.teamLeadId, { teamId: null });
        }
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
