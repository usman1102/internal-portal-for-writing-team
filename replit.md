# Freelance Writing Management Web Portal

## Overview

This is a comprehensive web portal designed to streamline the coordination and management of freelance writing projects. The system supports multiple user roles including superadmins, sales personnel, team leads, writers, and proofreaders, providing tailored dashboards and functionality for each role.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend components:

### Frontend Architecture
- **React.js** with TypeScript for the client-side application
- **Vite** for fast development and optimized builds
- **TailwindCSS** with shadcn/ui components for styling
- **Wouter** for lightweight client-side routing
- **React Query (TanStack Query)** for server state management
- **React Hook Form** with Zod validation for form handling

### Backend Architecture
- **Node.js** with Express.js server
- **TypeScript** throughout the entire application
- Session-based authentication using Passport.js with local strategy
- RESTful API design with role-based access control

### Database Layer
- **Drizzle ORM** for database operations
- **PostgreSQL** as the primary database (configured for Neon serverless)
- Database schema includes users, tasks, files, comments, activities, teams, and notifications

## Key Components

### Authentication & Authorization
- Session-based authentication with secure password hashing using scrypt
- Role-based access control (RBAC) supporting 5 user roles:
  - SUPERADMIN: Full system access
  - SALES: Project and task creation, deadline management
  - TEAM_LEAD: Team management and task oversight
  - WRITER: Task execution and submission
  - PROOFREADER: Content review and approval
- Protected routes ensuring proper access control

### Task Management System
- Comprehensive task lifecycle management (NEW → IN_PROGRESS → UNDER_REVIEW → COMPLETED → SUBMITTED)
- File upload/download capabilities for task submissions
- Task assignment based on user roles and team membership
- Deadline tracking with visual indicators
- Comment system for task collaboration

### Team Management
- Hierarchical team structure with team leads
- Team member management and status tracking
- Team-based task filtering and assignment

### File Management
- Support for multiple file types (documents, images, etc.)
- File categorization (REFERENCE, SUBMISSION, REVISION)
- Secure file upload with size and type validation

### Activity Tracking
- Comprehensive audit trail for all system actions
- Real-time activity feeds for transparency
- Performance analytics and reporting capabilities

### Push Notification System
- Real-time notifications for all key system events
- Role-based notification targeting (superadmin receives all notifications)
- Notification bell with unread count badge in dashboard header
- Automated deadline reminders (2 days and 1 day before due date)
- Notification triggers for task creation, assignment, status changes, comments, and file uploads
- Database-backed notification storage with read/unread status tracking

## Data Flow

1. **Authentication Flow**: Users log in through the auth page, creating a session managed by Express-session with PostgreSQL storage
2. **Dashboard Flow**: Authenticated users are routed to role-specific dashboards with tailored data views
3. **Task Flow**: Tasks are created by authorized roles, assigned to team members, and progress through defined statuses
4. **File Flow**: Files are uploaded with tasks, stored securely, and made available for download by authorized users
5. **Activity Flow**: All significant actions generate activity records for audit and notification purposes

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **passport & passport-local**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Frontend Dependencies
- **@radix-ui/***: Accessible UI component primitives
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight routing
- **react-hook-form**: Form state management
- **zod**: Schema validation

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database migration tool

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

### Development Mode
- Uses `tsx` for TypeScript execution in development
- Vite dev server with HMR for fast development cycles
- Development-specific middleware and error handling

### Production Build
- Frontend built using Vite to static assets in `dist/public`
- Backend bundled using esbuild to `dist/index.js`
- Environment-specific configurations for database and session management

### Environment Configuration
- Database URL configuration for PostgreSQL connection
- Session secret management for secure authentication
- File upload limits and storage configuration

The application supports both local development and cloud deployment, with proper environment variable management and build optimization for production use.

## Changelog
```
Changelog:
- June 29, 2025. Initial setup
- June 29, 2025. Implemented comprehensive push notification system:
  * Added notification bell component with unread count badge
  * Created notification database schema with proper relationships
  * Implemented notification service with role-based targeting
  * Added notification triggers for task creation, assignment, status changes, comments, and file uploads
  * Implemented deadline reminder service running hourly
  * Added notification API routes for fetching and managing notifications
  * Integrated notification system into dashboard header
- June 29, 2025. Enhanced notification system with improved UX:
  * Added individual tick buttons to mark notifications as read
  * Enhanced notification messaging to include user names and context
  * Made notifications clickable with automatic navigation to relevant tasks
  * Added task IDs to all notification messages for better identification
  * Implemented "Mark all as read" functionality with proper API integration
- July 14, 2025. Added birthday celebration popup:
  * Created one-time birthday celebration popup with beautiful animations
  * Added localStorage tracking to show popup only once per user
  * Implemented gradient background, emojis, and floating confetti effects
  * Added bouncy entrance animation with scale and rotation
- July 14, 2025. Enhanced task management with proofreader assignment and budgeting:
  * Added proofreader assignment field to tasks (proofreaderId)
  * Added budget fields: writer_budget, proofreader_budget, tl_budget (in PKR)
  * Updated edit task dialog with separate writer and proofreader assignment dropdowns
  * Implemented role-based access control for budget fields (superadmin and relevant team leads only)
  * Updated database schema with new task columns
  * Enhanced task editing interface with responsive grid layout for assignments and budgets
- July 14, 2025. Implemented payment system with budget integration:
  * Payment records are automatically created when tasks are marked as COMPLETED or SUBMITTED
  * Writer payments created based on writer_budget when writer is assigned
  * Proofreader payments created based on proofreader_budget when proofreader is assigned
  * Team lead payments created based on tl_budget for task creator
  * All payments default to UNPAID status and are sorted by task ID in ascending order
  * Payment amounts reflect the budgets set in the edit task dialog (default 0 PKR)
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```