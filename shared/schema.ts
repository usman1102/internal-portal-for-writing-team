import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Roles
export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  SALES = 'SALES',
  TEAM_LEAD = 'TEAM_LEAD',
  WRITER = 'WRITER',
  PROOFREADER = 'PROOFREADER'
}

// Task Status
export enum TaskStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  UNDER_REVIEW = 'UNDER_REVIEW',
  COMPLETED = 'COMPLETED',
  SUBMITTED = 'SUBMITTED'
}

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").$type<UserRole>().notNull(),
  status: text("status").default('AVAILABLE'),
  teamId: integer("team_id"),
  dateOfBirth: text("date_of_birth"),
  city: text("city"),
  degree: text("degree"),
  theme: text("theme").default("light"),
});

// Teams schema
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  teamLeadId: integer("team_lead_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasks schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  wordCount: integer("word_count"),
  clientName: text("client_name"),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  assignedById: integer("assigned_by_id").references(() => users.id),
  status: text("status").$type<TaskStatus>().default(TaskStatus.NEW),
  deadline: timestamp("deadline"),
  submissionDate: timestamp("submission_date"),
  createdAt: timestamp("created_at").defaultNow(),
  budget: doublePrecision("budget"),
});

// File Categories
export enum FileCategory {
  INSTRUCTION = 'INSTRUCTION', // Files uploaded during task creation (instructions)
  DRAFT = 'DRAFT',            // Draft files uploaded by writers
  FINAL = 'FINAL',            // Final submission files by writers
  FEEDBACK = 'FEEDBACK'       // Feedback files from proofreaders
}

// Files schema
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  uploadedById: integer("uploaded_by_id").references(() => users.id).notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  category: text("category").$type<FileCategory>().notNull().default(FileCategory.INSTRUCTION),
  isSubmission: boolean("is_submission").default(false),
});

// Comments schema
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activities schema
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  taskId: integer("task_id").references(() => tasks.id),
  action: text("action").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});



// Schema validation with Zod
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;



export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, assignedToId: true }).extend({
  deadline: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  wordCount: z.number().positive().optional(),
  clientName: z.string().min(1, "Client name is required")
});
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const insertFileSchema = createInsertSchema(files).omit({ id: true, uploadedAt: true });
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;



export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true });
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  teamLead: one(users, {
    fields: [teams.teamLeadId],
    references: [users.id],
  }),
  members: many(users),
}));
