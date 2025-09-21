# Jits Journal - Brazilian Jiu-Jitsu Training Companion

## Overview
Jits Journal is a comprehensive Brazilian Jiu-Jitsu training companion application designed to help practitioners track their progress, manage training data, and enhance their learning experience. It offers features for class tracking, note-taking, belt progression, and video search. The application aims to provide a mobile-first, intuitive experience to support BJJ practitioners in their journey.

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
- **Design Principles**: Mobile-first, responsive, touch-friendly interface with bottom navigation. Progressive Web App (PWA) ready. Clean and crisp design with subtle hover effects and modern gradients.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM, specifically using Neon Database for serverless deployment.
- **API Design**: RESTful API with JSON responses.
- **Authentication**: JWT token-based authentication with secure password hashing.
- **Data Isolation**: Ensures each user sees only their own data.

### Core Features
- **Class Tracking System**: Log training sessions, track instructors/partners, record techniques, generate attendance statistics.
- **Note-Taking System**: Rich text notes with tagging, linking to classes/videos, and video attachment capabilities (gallery upload and camera recording).
- **Belt Tracking System**: Track belt promotions, stripes, and visually represent current belt status.
- **Video Search Functionality**: Integrated YouTube search for BJJ techniques, categorized for easy access.
- **Weekly Commitment System**: Set and track weekly class goals with progress monitoring.
- **Social Features**: Note sharing with community feed, friend invitation system.

### UI/UX Decisions
- Custom BJJ-themed styling with a professional, clean, and modern aesthetic.
- Responsive design optimized for mobile devices with a focus on thumb navigation.
- Use of comprehensive component library based on Radix UI for accessibility.
- Integration of inspiring BJJ quotes on the dashboard.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity.
- **drizzle-orm**: Type-safe database ORM.
- **@tanstack/react-query**: Server state management.
- **@radix-ui/***: Accessible UI primitives.
- **wouter**: Lightweight routing library.

- **Capacitor**: For Android APK/AAB generation and mobile app store compatibility.

### Development & UI Libraries
- **Vite**: Build tool and development server.
- **TypeScript**: For type safety.
- **Tailwind CSS**: Utility-first CSS framework.
- **ESBuild**: Fast JavaScript bundler for server code.
- **shadcn/ui**: Pre-built accessible components.
- **lucide-react**: Icon library.

### PWA & Offline
- **Service Worker**: Currently disabled due to aggressive caching issues during development. Will be re-enabled for production deployment.

## Recent Changes
- **January 2025**: 
  - Resolved persistent browser caching issues preventing navigation tabs from working
  - Navigation Fix: Created SimpleNavApp.tsx as a cache-busting solution - requires opening new browser window to see changes
  - Authentication: Full password reset system implemented with email integration
  - Profile dropdown added to home screen with user statistics (total classes, last promotion date)
  - Fixed authentication token storage inconsistency (now using 'token' consistently)
  - **August 2025**: Switched from Stripe to app store subscriptions per user request
    - Removed Stripe payment processing (keeping subscription model)
    - App stores (Google Play/Apple) will handle all billing and payments
    - Subscription tiers maintained: Free tier (10 classes, 5 notes) vs Premium (unlimited)
    - Settings page updated to show subscription status and app store billing info
    - Improved weekly goals functionality: Fixed week calculation logic and update mechanism
    - Updated notification duration: Changed from 2 seconds to 4 seconds per user request
    - **August 11, 2025**: Weekly Goals System Completely Fixed
      - Root cause identified: Multiple conflicting storage classes causing method availability issues
      - Fixed file corruption with 1000+ lines of orphaned database method fragments
      - Removed conflicting DatabaseStorage and MemStorage classes, kept only MemStoragePrimary
      - Added complete weekly commitment method implementations (create, get, update, delete)
      - Enhanced Map-based storage with comprehensive debugging logs
      - All API endpoints now working: POST /api/weekly-commitments, GET /api/weekly-commitments, GET /api/weekly-commitments/current
      - Frontend confirmed working - users can successfully set and update weekly class targets
      - Goals persist within current session until database endpoint is re-enabled
      - **CRITICAL SECURITY FIX**: Fixed major data isolation vulnerability where new users could see other users' data
        - Root cause: API routes were hardcoded to use userId=1 or missing authentication entirely
        - Fixed authentication on all user data routes: weekly commitments, stats, drawings, videos
        - Corrected JWT token parsing from req.user.id to req.user.userId
        - Verified complete data isolation: each user now sees only their own data
        - Tested with multiple users - confirmed no cross-user data leakage
      - **SESSION ISOLATION**: Implemented secure session management to prevent shared links from auto-logging users into original account
        - Changed token storage from generic 'token' to 'bjj_auth_token' for app-specific isolation
        - Uses sessionStorage by default (clears on browser tab close) with optional localStorage for "Remember Me"
        - Prevents shared URLs from inheriting previous user sessions
        - Enhanced security for link sharing and multi-user environments
    - **August 12, 2025**: Camera Recording & Social Sharing Features Completed
      - Camera functionality fully implemented with live preview and high-quality recording (1280x720 with audio)
      - Enhanced camera permission handling with detailed error messages for troubleshooting
      - Social note sharing system completed - users can share notes to Community tab with author attribution
      - API endpoints implemented for note sharing: /api/notes/:id/toggle-sharing and /api/notes/shared
      - Community Notes section displays shared notes with author information and creation dates
      - Confirmed working: Camera recording works perfectly on production deployment, development has expected permission restrictions
    - **August 13, 2025**: Enhanced Class Logging with Summary Details
      - Added brief summary notifications when logging classes with instructor or notes details
      - Notification shows preview like "Gi class logged - with John Smith • Worked on guard passes..."
      - Enhanced class cards to display instructor name and notes in the saved classes list
      - Fixed form data preservation issue to ensure summary generation works correctly
      - User confirmed feature working perfectly - provides immediate feedback and persistent detail display
    - **August 14, 2025**: Premium Account Setup Completed
      - Fixed authentication and premium access for joe833360@gmail.com (Jits Journal)
      - Resolved password conflicts by removing default account creation
      - Added joe833360@gmail.com to frontend unlimited access list
      - Both premium accounts now working: Joe@cleancutconstructions.com.au and joe833360@gmail.com
      - Users confirmed premium access with unlimited classes/notes (∞ symbols)
    - **August 16, 2025**: Premium Auto-Upgrade Confirmed Working
      - joe833360@gmail.com account successfully auto-upgraded to premium on fresh signup
      - Memory storage resets require re-signup but premium detection works immediately
      - System properly grants unlimited access and premium status display
    - **August 17, 2025**: Enhanced Class Logging with Rolling Tracking
      - Added rolling partners field (comma-separated names)
      - Added submission tracking (your subs vs partner subs)
      - Added cardio rating system (1-5 scale with emoji indicators)
      - Updated class display cards to show rolling session details
      - Enhanced form with dedicated "Rolling Session" section
      - Fixed login persistence issue with "Keep me signed in" checkbox (defaults to checked for mobile app experience)
    - **August 18, 2025**: Note Editing and Deletion Features
      - Added full note editing functionality with pre-populated form
      - Added note deletion with confirmation dialog
      - Enhanced note cards with Edit/Delete action buttons
      - Form dynamically shows "Edit Note" vs "New Note" title
      - Added proper authentication to update/delete API endpoints
      - Improved form UX with Cancel/Update button layout
    - **September 3, 2025**: RevenueCat Integration Completed
      - Integrated RevenueCat JavaScript SDK for subscription management
      - Added RevenueCat service layer with configure, purchase, and restore functionality
      - Created webhook endpoints for automatic subscription status updates
      - Enhanced user schema with subscription status and RevenueCat customer ID tracking
      - Built RevenueCatSubscription component for premium upgrade flows
      - Updated Settings page to use RevenueCat instead of mock subscription plans
      - Added subscription sync API endpoint for backend validation
      - Subscription status now syncs between RevenueCat and backend automatically
      - Supports all RevenueCat platforms: iOS App Store, Google Play, and web payments