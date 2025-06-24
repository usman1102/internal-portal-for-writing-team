# Freelance Writing Management System

## Overview

This is a full-stack web application built for managing freelance writing projects and teams. The system provides role-based access control for different user types including superadmins, sales personnel, team leads, writers, and proofreaders. It features task management, team organization, user authentication, and a modern responsive UI.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite for development and building
- **PWA Support**: Service worker registration for progressive web app features

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Store**: PostgreSQL-backed sessions with connect-pg-simple
- **Password Security**: Node.js crypto module with scrypt hashing
- **API Design**: RESTful endpoints with role-based access control

### Data Storage
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Connection**: @neondatabase/serverless with WebSocket support
- **Migrations**: Drizzle Kit for schema management
- **Session Storage**: PostgreSQL table for user sessions

## Key Components

### Authentication System
- Local username/password authentication
- Session-based authentication with secure cookies
- Role-based access control (RBAC) with 5 user roles
- Protected routes on both client and server
- Password hashing using scrypt with salt

### User Management
- User registration and profile management
- Role assignment (SUPERADMIN, SALES, TEAM_LEAD, WRITER, PROOFREADER)
- Team assignment and management
- User status tracking
- Theme preferences per user

### Task Management
- Task creation with assignments to users
- Status tracking (NEW, IN_PROGRESS, UNDER_REVIEW, COMPLETED, SUBMITTED)
- File attachments and comments
- Activity logging for audit trail
- Deadline management with visual indicators

### UI/UX Features
- Responsive design with mobile-first approach
- Dark/light theme switching with multiple color schemes
- PWA installation prompt
- Toast notifications for user feedback
- Loading states and error handling
- Accessible components using Radix UI primitives

## Data Flow

1. **Authentication Flow**: User logs in → Passport validates credentials → Session created → User data cached in React Query
2. **Task Management Flow**: User creates/updates task → API validates permissions → Database updated → Real-time UI updates via query invalidation
3. **File Upload Flow**: User selects file → Client validates size/type → Uploads to server → Server processes and stores metadata
4. **Theme Flow**: User selects theme → Client updates local state → Server updates user preferences → Theme persisted across sessions

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React, React DOM, React Hook Form
- **UI Components**: Radix UI primitives, shadcn/ui components
- **Styling**: Tailwind CSS, class-variance-authority, clsx
- **State Management**: TanStack Query
- **Validation**: Zod for schema validation
- **Date Handling**: date-fns for date formatting
- **Icons**: Lucide React for consistent iconography

### Backend Dependencies
- **Express Framework**: express, express-session
- **Database**: drizzle-orm, @neondatabase/serverless
- **Authentication**: passport, passport-local
- **Session Storage**: connect-pg-simple
- **Validation**: drizzle-zod for schema validation
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Build Tools**: Vite, esbuild
- **Type Checking**: TypeScript with strict configuration
- **Linting**: Built-in TypeScript compiler checks
- **Database**: Drizzle Kit for migrations and schema management

## Deployment Strategy

### Development Environment
- Uses Vite development server with HMR
- Express server runs on port 5000
- Environment variables for database connection
- Replit-specific configuration for cloud development

### Production Build
- Vite builds client assets to `dist/public`
- esbuild bundles server code to `dist/index.js`
- Static file serving for production assets
- PostgreSQL database with connection pooling

### Environment Configuration
- **Development**: NODE_ENV=development, tsx for server execution
- **Production**: NODE_ENV=production, compiled JavaScript execution
- **Database**: DATABASE_URL environment variable required
- **Sessions**: SESSION_SECRET for secure session signing

## Changelog

- June 24, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.