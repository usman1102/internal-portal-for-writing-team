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
  REVIEW = 'REVIEW',
  REVISION = 'REVISION',
  COMPLETED = 'COMPLETED'
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
});

// Teams schema
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  teamLeadId: integer("team_lead_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Projects schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  clientName: text("client_name"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  budget: doublePrecision("budget"),
  status: text("status").default('ACTIVE'),
});

// Tasks schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  projectId: integer("project_id").references(() => projects.id),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  status: text("status").$type<TaskStatus>().default(TaskStatus.NEW),
  priority: text("priority"),
  wordCount: integer("word_count"),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow(),
  assignedById: integer("assigned_by_id").references(() => users.id),
  submissionDate: timestamp("submission_date", { mode: "date" }),
  budget: doublePrecision("budget"),
});

// Files schema
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  uploadedById: integer("uploaded_by_id").references(() => users.id),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  isSubmission: boolean("is_submission").default(false),
});

// Comments schema
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activities schema
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  userId: integer("user_id").references(() => users.id),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
  taskId: integer("task_id").references(() => tasks.id),
  projectId: integer("project_id").references(() => projects.id),
  description: text("description"),
});

// Analytics schema
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  projectId: integer("project_id").references(() => projects.id),
  data: jsonb("data"),
  period: text("period").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema validation with Zod
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true }).extend({
  deadline: z.string().optional().transform((val) => val ? new Date(val) : undefined)
});
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const insertFileSchema = createInsertSchema(files).omit({ id: true, uploadedAt: true }).extend({
  taskId: z.number()
});
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true }).extend({
  taskId: z.number()
});
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true }).extend({
  entityType: z.string(),
  entityId: z.number()
});
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({ id: true, createdAt: true });
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;

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
