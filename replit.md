# Jits Journal - Brazilian Jiu-Jitsu Training Companion

## Overview
Jits Journal is a comprehensive mobile-first Brazilian Jiu-Jitsu training companion application designed to help practitioners track their progress, manage training data, and enhance their learning experience. It offers features for class tracking, note-taking, belt progression, video search, and competition game plan creation. The application aims to provide an intuitive experience, supporting BJJ practitioners in their journey with a clean, responsive, and PWA-ready design. It includes a free tier and premium subscriptions managed via app stores, targeting the global BJJ community.

## Mobile App Status (v1.0.43)
### Android
- ✅ Build configured and tested
- ✅ Google Play Store subscriptions created (bjj_enthusiast_monthly: $9.99 AUD, gym_pro_monthly: $19.99 AUD)
- ✅ RevenueCat integration configured
- ✅ Simplified subscription flow (opens Play Store for subscription purchase)
- 📦 Build command: `./gradlew bundleRelease` (generates AAB for Play Store)
- 📱 App ID: com.jitsjournal.app

### iOS
- ✅ Xcode project configured (v1.0.43)
- ✅ App icons and splash screens ready
- ✅ Capacitor synced with latest web build
- 📖 Full build guide: IOS_BUILD_GUIDE.md
- 🛠️ Build script: build-ios.sh
- 📱 Bundle ID: com.jitsjournal.app
- ⏳ Status: Ready for Mac build and App Store submission

### Subscription Architecture
- **Design:** Users subscribe via native app store UI (not in-app SDK)
- **Sync:** RevenueCat automatically syncs subscription status via webhooks
- **Backend:** Server checks RevenueCat API for entitlements
- **Benefits:** Simpler codebase, higher user trust, consistent cross-platform experience

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

### Core Features
- **Class Tracking System**: Log training sessions, track instructors/partners, record techniques, and generate attendance statistics, including rolling partner tracking and submission details.
- **Note-Taking System**: Rich text notes with tagging, linking to classes/videos, video attachment capabilities (5GB video upload limit), and community sharing.
- **Belt Tracking System**: Track belt promotions, stripes, and visually represent current belt status.
- **Video Search Functionality**: Integrated YouTube search for categorized BJJ techniques.
- **Weekly Commitment System**: Set and track weekly class goals with progress monitoring.
- **Competition Game Plans**: Tree-based game plan system for competition strategy with AI-powered counter move suggestions using OpenAI GPT-4.
- **Subscription Management**: Supports free and premium tiers with in-app purchases via RevenueCat integration.
- **Admin Tools**: Role-based access control for community moderation.
- **Gym Community System**: Private gym communities where users join using auto-generated codes. Only gym admins can share notes to their gym. Features include:
  - Admin panel for gym creation with unique auto-generated codes
  - Join gym functionality via code entry in Settings
  - Private gym-specific note sharing (admin-only)
  - "My Gym" tab in Social page to view gym notes
  - Role-based access control (admin vs member)

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