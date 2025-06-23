# Globetrotter Travel Booking Application

## Overview

This is a comprehensive travel booking platform built as a full-stack web application. The system provides users with an immersive experience for discovering and booking luxury travel destinations worldwide, featuring a 3D interactive globe, detailed itineraries, payment processing via Stripe, and administrative management capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with custom design system featuring glassmorphism effects
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Build Tool**: Vite for fast development and optimized builds
- **3D Graphics**: Three.js for interactive Earth globe visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Session-based authentication with OpenID Connect (Replit Auth)
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple

### Data Storage Solutions
- **Primary Database**: PostgreSQL with the following key tables:
  - `users` - User account management with role-based access
  - `destinations` - Travel destination information with rich metadata
  - `bookings` - Booking records with detailed travel information
  - `reviews` - User reviews and ratings for destinations
  - `activity_logs` - System activity tracking for analytics
  - `sessions` - Session management for authentication

### Authentication and Authorization Mechanisms
- **Primary Auth**: Local username/password authentication with bcrypt hashing
- **Session Management**: Secure HTTP-only cookies with PostgreSQL session storage
- **Role-Based Access**: User roles (user, admin, travel_agent, support) with appropriate permissions
- **Route Protection**: Authentication middleware protecting sensitive endpoints

## Key Components

### User Interface Components
- **Interactive Globe**: Three.js-powered 3D Earth with destination markers
- **Responsive Design**: Mobile-first approach with glassmorphism aesthetic
- **Component Library**: Comprehensive UI components built on Radix UI
- **Performance Optimizations**: Image lazy loading, code splitting, and caching strategies

### Business Logic Components
- **Booking System**: Complete booking workflow with date selection, guest management, and upgrades
- **Payment Processing**: Stripe integration for secure payment handling
- **Review System**: User-generated content with ratings and comments
- **Administrative Dashboard**: Comprehensive management interface for admins

### Data Management Components
- **Type-Safe Database**: Drizzle ORM with Zod schema validation
- **Query Optimization**: Efficient database queries with proper indexing
- **Image Management**: URL validation and duplicate prevention system
- **Analytics Tracking**: Activity logging and performance monitoring

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth or username/password
2. **Destination Discovery**: Browse destinations via interactive globe or traditional listing
3. **Booking Process**: Select dates, guests, upgrades, and proceed to payment
4. **Payment Processing**: Secure payment via Stripe with booking confirmation
5. **Trip Management**: Users can view and manage their bookings
6. **Administrative Oversight**: Admins manage destinations, users, and bookings via dashboard

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client for Neon Database (or local PostgreSQL)
- **drizzle-orm**: Type-safe ORM for database operations
- **@stripe/stripe-js**: Payment processing integration
- **three**: 3D graphics library for globe visualization
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight routing library

### Development Tools
- **TypeScript**: Type safety across the entire application
- **Vite**: Fast build tool with hot module replacement
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production builds

### Authentication & Security
- **bcryptjs**: Password hashing for local authentication
- **express-session**: Session management middleware
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Local Development Environment
- **Platform**: Any system with Node.js 18+ support
- **Database**: PostgreSQL (local installation or Docker container)
- **Hot Reloading**: Vite development server with live updates
- **Environment Variables**: Local .env file for API keys and database credentials

### Production Build
- **Frontend**: Static assets built with Vite and served via Express
- **Backend**: Node.js application with optimized bundles
- **Database Migrations**: Drizzle migrations for schema management
- **Deployment Target**: Any Node.js hosting platform (Vercel, Netlify, AWS, DigitalOcean, etc.)

### Local Setup Instructions

#### Prerequisites
- Node.js 18 or higher
- PostgreSQL 12 or higher (local installation or Docker)
- Git

#### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd globetrotter-travel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   
   Option A - Local PostgreSQL:
   ```bash
   # Create database
   createdb globetrotter_travel
   ```
   
   Option B - Docker:
   ```bash
   docker run --name postgres-travel \
     -e POSTGRES_PASSWORD=your_password \
     -e POSTGRES_DB=globetrotter_travel \
     -p 5432:5432 -d postgres:15
   ```

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/globetrotter_travel
   SESSION_SECRET=your-super-secret-session-key
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   OPENAI_API_KEY=your_openai_api_key_for_chatbot
   NODE_ENV=development
   ```

5. **Initialize database schema**
   ```bash
   npm run db:push
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Access the application**
   Open your browser to `http://localhost:5000`

#### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

#### Database Configuration

For production deployments, you can use:
- **Neon Database**: Serverless PostgreSQL (recommended for cloud deployments)
- **AWS RDS**: Managed PostgreSQL service
- **DigitalOcean Managed Databases**: Simple PostgreSQL hosting
- **Local PostgreSQL**: For on-premise deployments

### Performance Considerations
- **Code Splitting**: Lazy loading of route components
- **Image Optimization**: Optimized Unsplash images with proper sizing
- **Caching**: Browser caching for static assets and API responses
- **Bundle Optimization**: Tree shaking and minification for production builds

## Changelog
- June 14, 2025. Initial setup
- June 16, 2025. Removed all Replit-specific dependencies and domains, implemented local authentication system, enabled local hosting
- June 19, 2025. Connected to user's personal PostgreSQL database on Render, database configured and empty
- June 23, 2025. Enhanced UI with dropdown calendar components, implemented comprehensive date validation with toast notifications, set Australian Dollar as default currency, updated destination popularity rankings
- June 23, 2025. Fixed pricing calculation mismatch - destination-specific fees now properly included in subtotal calculations, ensuring total amount is always equal to or less than subtotal

## User Preferences

Preferred communication style: Simple, everyday language.
Database preference: Personal PostgreSQL database on Render (travelex1 database)