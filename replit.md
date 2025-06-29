# Freelance Writing Management System

## Overview

This is a full-stack web application built for managing freelance writing tasks and teams. The system provides role-based access control for different user types (Superadmin, Sales, Team Lead, Writer, Proofreader) and comprehensive task management capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Form Management**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful API with role-based access control
- **Password Security**: Scrypt hashing with salt for password storage

### Data Storage Solutions
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with type-safe queries
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple

## Key Components

### Web Application Features
- **Browser-Based Access**: Pure web application accessible through any modern browser
- **Responsive Design**: Optimized for desktop, tablet, and mobile browsers
- **Cross-Platform Compatibility**: Works on all operating systems and browsers

### Authentication & Authorization
- **Multi-role System**: 5 distinct user roles with different permissions
- **Session-based Auth**: Secure session management with PostgreSQL backing
- **Protected Routes**: Frontend route protection with role-based access
- **Password Security**: Scrypt-based password hashing with salts

### Task Management System
- **Task Lifecycle**: NEW → IN_PROGRESS → UNDER_REVIEW → COMPLETED → SUBMITTED
- **Role-based Permissions**: Different users can perform different actions based on roles
- **File Attachments**: Support for task-related file uploads and management
- **Comments System**: Task-based commenting and collaboration

### User Management
- **Profile Management**: User profile editing with personal information
- **Team Organization**: Team-based user grouping with team lead assignments
- **Theme Customization**: Multiple theme options (light, dark, blue, green, purple)
- **Status Tracking**: User availability status management

### UI/UX Features
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Dark Mode Support**: Complete dark/light theme system
- **Component Library**: Comprehensive UI component system using Radix primitives
- **Toast Notifications**: User feedback system for actions and errors
- **Loading States**: Proper loading and error state management
- **In-App Notifications**: Real-time notification system with WebSocket connections
- **Notification Bell**: Comprehensive notification center with read/unread status tracking

## Data Flow

1. **Authentication Flow**: User login → Session creation → Role-based access granted
2. **Task Management Flow**: Task creation → Assignment → Progress tracking → Completion
3. **File Management Flow**: File upload → Storage → Association with tasks
4. **Activity Tracking Flow**: User actions → Activity logging → Audit trail

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **passport**: Authentication middleware
- **express-session**: Session management
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework

### PWA Dependencies
- **Service Worker**: Custom service worker for offline caching
- **Web App Manifest**: PWA manifest with mobile-specific configuration
- **Mobile Detection**: React hooks for device detection and PWA management

### Development Dependencies
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **vite**: Development server and build tool

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite dev server with HMR
- **Database**: Local PostgreSQL or Neon development database
- **Session Storage**: PostgreSQL-backed sessions
- **Port Configuration**: Development server on port 5000

### Production Environment
- **Build Process**: Vite build for frontend, esbuild for backend
- **Database**: Neon serverless PostgreSQL
- **Session Persistence**: PostgreSQL session store
- **Static Assets**: Served from dist/public directory
- **Environment Variables**: DATABASE_URL and SESSION_SECRET required

### Replit Configuration
- **Modules**: Node.js 20, Web, PostgreSQL 16
- **Auto-deployment**: Configured for autoscale deployment
- **Port Mapping**: Internal port 5000 mapped to external port 80
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 24, 2025. Initial setup
- June 28, 2025. Added Progressive Web App (PWA) functionality:
  - Chrome-only PWA implementation with browser detection
  - Safari on iOS loads as web app without PWA features
  - Custom service worker for offline capability
  - Install prompts and app manifest for Chrome only
  - Desktop remains web-only as requested
  - Updated app name to "Paper Slay"
  - Fixed mobile file view responsiveness
  - Uses blue "P" logo with proper icon sizing
- June 28, 2025. Implemented comprehensive background push notifications:
  - Service worker with push event handling for background notifications
  - Rich notifications with task metadata, action buttons, and deep linking
  - Real VAPID keys configuration for secure push messaging via environment variables
  - Notification click handling to open app to specific tasks
  - Background sync for offline notification queue management
  - Push notification setup component with status indicators and test functionality
  - Service worker registration in main.tsx for proper PWA functionality
  - Enhanced notification service with logging and error handling
  - iOS and Android PWA compatibility with proper permission requests
  - Direct VAPID-based push (no Firebase required) for true background notifications
- June 29, 2025. Finalized push notification system with user permission flow:
  - Added Settings page with comprehensive notification controls
  - Implemented permission prompt component for user consent
  - Enhanced service worker with vibration and delivery confirmations
  - Complete test suite validating all notification functionality
  - Background notifications confirmed working when app closed and device locked
  - User-friendly permission request flow with clear explanations
  - Final system ready for production deployment
- June 29, 2025. Removed PWA functionality and push notification permissions:
  - Converted from PWA to standard browser-based web application
  - Removed service worker, manifest file, and PWA installation prompts
  - Removed push notification permission requests and setup components
  - Kept in-app notification system with WebSocket real-time updates
  - Maintained notification bell with comprehensive notification center
  - Updated settings page to remove push notification controls
  - Simplified architecture for browser-only deployment