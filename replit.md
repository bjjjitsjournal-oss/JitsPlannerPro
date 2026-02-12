# Jits Journal - Brazilian Jiu-Jitsu Training Companion

## Overview
Jits Journal is a mobile-first Brazilian Jiu-Jitsu training companion application designed to help practitioners track progress, manage training data, and enhance their learning experience. It offers class tracking, note-taking, belt progression, video search, and competition game plan creation. The application aims to provide an intuitive experience, supporting BJJ practitioners with a clean, responsive, and PWA-ready design. It includes a free tier and premium subscriptions managed via app stores, targeting the global BJJ community.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **UI Components**: Radix UI with shadcn/ui
- **Styling**: Tailwind CSS with custom BJJ-themed color scheme (navy and red)
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite
- **Design Principles**: Mobile-first, responsive, touch-friendly interface with bottom navigation. Progressive Web App (PWA) ready. Clean and crisp design with subtle hover effects and modern gradients, including inspiring BJJ quotes on the dashboard.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM, utilizing Neon Database for serverless deployment.
- **API Design**: RESTful API with JSON responses.
- **Authentication**: JWT token-based authentication with secure password hashing and secure session management.
- **Data Isolation**: Ensures each user sees only their own data.
- **Video Storage**: Cloudflare R2 (S3-compatible) for scalable, cost-efficient video storage with zero egress fees. Legacy videos remain on Supabase Storage with automatic fallback.
- **Deployment**: Render.com with Infrastructure as Code (render.yaml) for automated deployments.

### Core Features
- **Class Tracking System**: Log training sessions, track instructors/partners, record techniques, and generate attendance statistics, including rolling partner tracking and submission details.
- **Note-Taking System**: Rich text notes with tagging, linking to classes/videos, video attachment capabilities, and community sharing.
- **Belt Tracking System**: Track belt promotions, stripes, and visually represent current belt status.
- **Video Search Functionality**: Integrated YouTube search for categorized BJJ techniques.
- **Weekly Commitment System**: Set and track weekly class goals with progress monitoring.
- **Competition Game Plans**: Tree-based game plan system for competition strategy with AI-powered counter move suggestions.
- **Subscription Management**: Supports free and premium tiers with in-app purchases.
- **Admin Tools**: Role-based access control for community moderation.
- **Gym Community System**: Private gym communities with auto-generated codes, admin panels, and gym-specific note sharing.

### UI/UX Decisions
- Custom BJJ-themed styling with a professional, clean, and modern aesthetic.
- Responsive design optimized for mobile devices with a focus on thumb navigation.
- Use of comprehensive component library based on Radix UI for accessibility.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL database connectivity.
- **drizzle-orm**: Type-safe database ORM.
- **@tanstack/react-query**: Server state management.
- **@radix-ui/***: Accessible UI primitives.
- **wouter**: Lightweight routing library.
- **Capacitor**: For Android APK/AAB generation and mobile app store compatibility.
- **Vite**: Build tool.
- **TypeScript**: For type safety.
- **Tailwind CSS**: Utility-first CSS framework.
- **shadcn/ui**: Pre-built accessible components.
- **lucide-react**: Icon library.
- **RevenueCat**: Subscription management platform.
- **OpenAI GPT-4**: For AI-powered counter move suggestions in game plans.

## Pending Tasks

### Apple App Store Submission (iOS)
- **Status**: Rejected - Guideline 2.1 Performance - App Completeness
- **Issue**: In-app purchases not submitted for review alongside the app
- **Fix needed**: In App Store Connect, ensure subscription products are set to "Ready to Submit" and included when resubmitting the app
- **Code fix done**: Restore Purchases button now shows on both iOS and Android (was iOS-only)

### Deployment Workflow
- Replit (development) → download zip → PC → GitHub push → Render auto-deploy (backend) / Codemagic build (mobile app)
- PC path: C:\Users\joe\Documents\thefinaljitsjournal\JitsPlannerPro
- Admin email: bjjjitsjournal@gmail.com
- Backend: jitsjournal-backend.onrender.com
- To update premium users in production: `psql $DATABASE_URL -c "UPDATE users SET subscription_status='premium', subscription_expires_at='2099-12-31' WHERE email='user@example.com';"` (run in Render shell)

### Premium Users List (in code - auto-premium on signup)
- joe833360@gmail.com
- Joe@cleancutconstructions.com.au
- bjjjitsjournal@gmail.com
- admin@apexbjj.com.au
- pakeliot@gmail.com

### Upcoming Features
- Push notifications for gym members when new notes/videos are posted (requires Firebase Cloud Messaging setup)