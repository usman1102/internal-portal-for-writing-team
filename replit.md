# Freelance Writing Management System

## Overview

This is a full-stack web application for managing freelance writing projects, built with React, TypeScript, Express, and PostgreSQL. The system provides role-based access control for different user types including superadmins, sales personnel, team leads, writers, and proofreaders. It manages task assignments, team collaboration, and project workflows in a writing environment.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Authentication**: Passport.js with local strategy and session-based auth
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Storage**: PostgreSQL-based session store with connect-pg-simple
- **API Design**: RESTful endpoints with role-based access control

## Key Components

### Authentication System
- Session-based authentication using Passport.js
- Password hashing with Node.js crypto (scrypt)
- Protected routes with role-based access control
- Automatic session management and cleanup

### Database Schema
- **Users**: Stores user information with roles (SUPERADMIN, SALES, TEAM_LEAD, WRITER, PROOFREADER)
- **Teams**: Manages team structure with team leads
- **Tasks**: Tracks writing assignments with status progression
- **Files**: Handles file attachments for tasks
- **Comments**: Enables task-specific communication
- **Activities**: Logs system activities for audit trails
- **Notifications**: Manages user notifications

### Role-Based Access Control
- **SUPERADMIN**: Full system access and user management
- **SALES**: Can create tasks and view basic user information
- **TEAM_LEAD**: Can manage team members and tasks
- **WRITER**: Can view and work on assigned tasks
- **PROOFREADER**: Can review and approve content

### Task Management
- Task status workflow: NEW → IN_PROGRESS → UNDER_REVIEW → COMPLETED → SUBMITTED
- File upload and attachment system
- Comments and activity tracking
- Deadline management with visual indicators

## Data Flow

1. **Authentication Flow**: User login → Session creation → Role validation → Route access
2. **Task Creation Flow**: Sales/Admin creates task → Assigns to writer → Status updates → File attachments → Review process
3. **Team Management Flow**: Team lead manages members → Task assignments → Progress tracking
4. **File Management Flow**: File upload → Storage → Task attachment → Download access

## External Dependencies

### Frontend Dependencies
- React ecosystem (React, React DOM, React Router)
- TanStack Query for data fetching
- Radix UI components for accessible UI primitives
- Tailwind CSS for styling
- React Hook Form with Zod validation
- Date-fns for date manipulation

### Backend Dependencies
- Express.js web framework
- Passport.js for authentication
- Drizzle ORM for database operations
- Neon serverless PostgreSQL client
- Session management with connect-pg-simple
- File handling and crypto utilities

### Development Dependencies
- TypeScript for type safety
- Vite for fast development and building
- ESBuild for server-side bundling
- Various Replit-specific plugins for development

## Deployment Strategy

### Development Environment
- Replit-based development with hot reload
- PostgreSQL 16 module for database
- Node.js 20 runtime environment
- Vite dev server on port 5000

### Production Build
- Client-side: Vite builds React app to `dist/public`
- Server-side: ESBuild bundles Express server to `dist/index.js`
- Database: Drizzle migrations handle schema changes
- Static files served from Express in production

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Session secret configuration
- Neon serverless WebSocket configuration
- Trust proxy settings for secure deployments

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 24, 2025. Initial setup