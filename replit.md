# VoiceAI Hub - AI Calling Agent Infrastructure

## Overview
VoiceAI Hub is a comprehensive multi-tenant SaaS platform for managing AI calling agents. This is a full-stack application that provides root admin capabilities for managing tenants, AI agent training, call management, and provider integrations. The platform is built with modern web technologies and designed for enterprise-scale deployment.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as the build tool for fast development and optimized production builds
- **Tailwind CSS** with shadcn/ui components for consistent design system
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **React Hook Form** with resolvers for form validation

### Backend Architecture
- **Express.js** server with TypeScript
- **Node.js** runtime environment
- **RESTful API** design pattern
- **Middleware-based request handling** with comprehensive logging
- **Error handling** with proper HTTP status codes

### Database Architecture
- **PostgreSQL** as the primary database
- **Drizzle ORM** for type-safe database operations
- **Neon Database** integration for serverless PostgreSQL
- **Schema-driven development** with TypeScript type generation

## Key Components

### Multi-Tenant System
- **Root Admin Dashboard** for managing all tenants
- **Tenant isolation** with proper data segregation
- **Plan-based limitations** (starter, professional, enterprise, custom)
- **Resource quotas** and usage tracking

### AI Agent Management
- **Training pipeline** for AI model customization
- **Document processing** capabilities
- **Agent status tracking** (active, inactive, training, deployed)
- **Performance monitoring** and analytics

### Communication Infrastructure
- **VoIP provider integration** for call handling
- **Real-time call management** with status tracking
- **Multi-provider support** for redundancy and optimization
- **Call routing** and load balancing

### Administration Features
- **System monitoring** with health checks
- **Provider status tracking** for all integrated services
- **Activity logging** for audit trails
- **Analytics dashboard** with key metrics

## Data Flow

### User Authentication & Authorization
- Admin-only access with role-based permissions
- Session management with secure cookies
- API endpoint protection with middleware

### Tenant Management Flow
1. Admin creates new tenant accounts
2. Tenant configuration with plan limits
3. Resource allocation and monitoring
4. Usage tracking and billing integration

### AI Training Pipeline
1. Document upload and processing
2. Training job queue management
3. Model deployment and testing
4. Performance monitoring and optimization

### Call Management Flow
1. Incoming call routing to appropriate agents
2. Real-time call status updates
3. Call recording and transcription
4. Analytics and reporting

## External Dependencies

### Core Dependencies
- **@google/genai** - Google Generative AI integration
- **@neondatabase/serverless** - Neon PostgreSQL serverless driver
- **drizzle-orm** - Type-safe database operations
- **express** - Web server framework
- **postgres** - PostgreSQL client library

### UI Dependencies
- **@radix-ui/** - Headless UI components
- **@tanstack/react-query** - Server state management
- **tailwindcss** - Utility-first CSS framework
- **lucide-react** - Icon library

### Development Dependencies
- **vite** - Build tool and development server
- **typescript** - Type checking
- **tsx** - TypeScript execution
- **esbuild** - JavaScript bundler

## Deployment Strategy

### Development Environment
- **Replit** hosting with Node.js 20 runtime
- **Hot module replacement** for fast development
- **PostgreSQL 16** module for database services
- **Auto-scaling** deployment target

### Production Build
- **Vite** builds optimized client bundle
- **esbuild** bundles server code for production
- **Static file serving** with Express
- **Environment variable** configuration

### Database Management
- **Drizzle migrations** for schema changes
- **Schema versioning** with TypeScript definitions
- **Connection pooling** for performance
- **Backup and recovery** strategies

## Recent Changes
- **July 5, 2025** - Implemented containerized multi-tenant architecture based on Replit infrastructure strategy
- **Campaign Execution Engine** - Built automated lead processing system with VoIP orchestrator, retry logic, and working hours scheduling
- **VoIP Orchestrator** - Created unified calling interface supporting multiple providers (Twilio, VoIP.ms, Vonage) with consistent API
- **Enhanced Database Schema** - Added containerized agents, campaigns, campaign leads, and VoIP logs tables for enterprise-scale operations
- **Campaign Management UI** - Professional campaign creation and monitoring interface with real-time progress tracking
- **Agent Container Management** - Infrastructure for isolated tenant environments with resource limits and health monitoring
- **Automated Lead Processing** - Smart retry logic, working hours compliance, and concurrent call management
- **June 25, 2025** - Complete comprehensive AI agent training SaaS platform delivered
- **Multi-Provider Integration** - Implemented 10 VoIP providers and multiple STT/TTS providers with unified interface

## Technical Architecture Updates
- **Database**: Enhanced PostgreSQL schema with comprehensive relations and constraints
- **Backend Services**: Provider service, AI training service, and Flowwise integration service
- **API Routes**: 25+ new endpoints for training, provider management, and flow operations
- **Frontend**: Complete multi-page application with advanced UI components and real-time updates
- **File Upload**: Multer integration for document processing with 50MB limit
- **Security**: Encrypted storage for sensitive provider configurations

## Changelog
- June 25, 2025. Initial setup and complete platform implementation

## User Preferences
Preferred communication style: Simple, everyday language.