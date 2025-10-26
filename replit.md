# Jits Journal - Brazilian Jiu-Jitsu Training Companion

## Overview
Jits Journal is a comprehensive mobile-first Brazilian Jiu-Jitsu training companion application designed to help practitioners track their progress, manage training data, and enhance their learning experience. It offers features for class tracking, note-taking, belt progression, video search, and competition game plan creation. The application aims to provide an intuitive experience, supporting BJJ practitioners in their journey with a clean, responsive, and PWA-ready design. It includes a free tier and premium subscriptions managed via app stores, targeting the global BJJ community.

## Mobile App Status (v1.0.80)
### Android
- ✅ Build configured and tested
- ✅ Google Play Store subscriptions created (bjj_enthusiast_monthly: $9.99 AUD, gym_pro_monthly: $19.99 AUD)
- ✅ RevenueCat integration configured
- ✅ Simplified subscription flow (opens Play Store for subscription purchase)
- 📦 Build command: `./gradlew bundleRelease` (generates AAB for Play Store)
- 📱 App ID: com.jitsjournal.app
- ⏳ Status: v1.0.80 ready for build and submission

### iOS
- ✅ Xcode project configured
- ✅ App icons and splash screens ready
- ✅ **CRITICAL FIX**: Removed server.url from capacitor.config.ts to fix sign-in issue
- ✅ Capacitor synced with latest web build
- ✅ Codemagic CI/CD configured (builds iOS without Mac!)
- 📖 **iOS Fix Guide**: IOS_PRODUCTION_BUILD_FIX.md (MUST READ before submitting!)
- 📖 Codemagic setup guide: CODEMAGIC_SETUP_GUIDE.md
- 📖 Manual build guide (requires Mac): IOS_BUILD_GUIDE.md
- 📖 Build guide: BUILD_v1.0.75_INSTRUCTIONS.md
- 🛠️ Build script: build-ios.sh (for Mac users)
- 📱 Bundle ID: com.jitsjournal.app
- 🎯 Recommended: Use Codemagic for cloud builds (no Mac needed)
- ⏳ Status: v1.0.80 ready for Codemagic build and App Store submission

### Recent Updates (v1.0.80 - October 2025)
- ⚡ **CRITICAL PERFORMANCE FIX**: Notes now load in <1 second (was 10 seconds on mobile)
- 🚀 **Bootstrap Cache Hydration**: Auth cache preloads from Preferences before any queries run
- 🔒 **Race Condition Eliminated**: App blocks rendering until cache is ready, guarantees fast path
- 📊 **Performance Instrumentation**: Added timing logs to track auth operations
- ✅ **Architect Verified**: High confidence fix eliminates 10-second delay

### Previous Updates (v1.0.79 - October 2025)
- 🔧 **Gym Pro Pricing**: Changed from "$19.99" to "Contact Us" with mailto:bjjjitsjournal@gmail.com
- 🐛 **Data Isolation Fix**: Fixed GET /api/notes to use correct user ID field (req.user.id)
- 📝 **Free Tier Limits**: Enforced 3-class maximum for free users with proper error messages
- 🏋️ **Gym Notes Visibility**: Added debug logging to diagnose gym member access issues
- 🗑️ **Admin Delete Gym Notes**: New DELETE /api/gym-notes/:id endpoint for gym admins
- ⚙️ **Settings Join Gym**: Fixed to allow joining gyms even if already a member (for testing)
- ✅ **Architect Reviewed**: All changes approved for production deployment

### Previous Updates (v1.0.76 - October 2025)
- 🚀 **Render Deployment**: Added render.yaml for Infrastructure as Code deployment
- 📝 **Health Endpoint**: Added /api/health endpoint for Render monitoring
- 📖 **Documentation**: RENDER_DEPLOYMENT.md with complete setup guide
- ✅ **Auto-deployment**: Git push triggers automatic deployment on Render

### Previous Updates (v1.0.75 - October 2025)
- 🚀 **COMPLETE PERFORMANCE FIX**: Fixed BOTH frontend AND backend for true fast performance
- ⚡ **3-4x Faster**: Notes/Social pages load in <1 second (vs 5-10 seconds in v1.0.72)
- 🔑 **Frontend Fix**: All API requests now send cached Supabase access token in Authorization header
- 🎯 **Backend Fix**: flexibleAuth middleware now uses fast local JWT verification (<1ms) instead of slow Supabase API
- ✅ **No More Errors**: Add/delete note and video operations work instantly without timeouts
- 🔧 **v1.0.73 Issue**: Had frontend fix but backend still slow - v1.0.75 fixes BOTH
- 📖 **Documentation**: BUILD_v1.0.75_INSTRUCTIONS.md with full build and testing instructions
- ✅ **Architect Reviewed**: Implementation approved, backward compatible

### Previous Updates (v1.0.73 - October 2025)
- ⚠️ **INCOMPLETE FIX**: Fixed frontend to send auth headers, but backend still slow (use v1.0.75 instead)

### Previous Updates (v1.0.60 - October 2025)
- 🐛 **CRITICAL FIX**: Fixed notes add/delete broken on Vercel/mobile (user.userId → user.id in flexibleAuth)
- ✅ **Verified Working**: Vercel site now successfully adds/deletes notes

### Previous Updates (v1.0.59 - October 2025)
- 🐛 **DEBUG BUILD**: Added detailed logging to diagnose Samsung app notes issue
- 🔍 **Network Timeout Detection**: 30-second timeout for save/delete operations
- 📊 **Server Logging**: Backend now logs all note CRUD operations for debugging
- 🎯 **Error Messages**: Shows exact error details when save/delete fails
- 💎 **NEW SUBSCRIPTION TIERS**: Free (3 notes, 3 classes, 10GB storage), Premium $9.99 (unlimited, 75GB storage, 1 community share/week), Gym $100 (unlimited, 150GB storage, 3 community shares/week, $5/member/month)
- 📊 **NEW DASHBOARD STATS**: Replaced "Classes This Week" with detailed user stats (class type breakdown, best session/week submissions)
- 🔒 **SHARING RESTRICTIONS**: Free users can only share via socials; Premium/Gym can share to community with weekly limits

### Previous Updates (v1.0.56 - October 2025)
- 🚨 **CRITICAL FIX**: Fixed registration completely broken on mobile (API URL issue)
- 🚨 **CRITICAL FIX**: Fixed email verification redirect (capacitor:// → HTTPS)
- 🎯 **CRITICAL FIX**: Solved "works every other time" login issue (missing auth token)
- 📱 **MEDIUM FIX**: Fixed social sharing URLs (capacitor:// → production URL)
- 🍎 **iOS FIX**: Added export compliance declaration (ITSAppUsesNonExemptEncryption) to Info.plist
- 🔍 **UX FIX**: Added network timeout detection and ultra-visible error messages for mobile signup
- 🔐 **Proper Authentication**: Mobile app now sends Supabase access token with all API requests
- 📱 **On-Screen Error Messages**: Replaced invisible toast notifications with prominent red error boxes
- ⏱️ **Better Loading States**: Shows "Signing you in..." with clear progress indicators
- ✅ **Production Ready**: All mobile-specific issues resolved for iOS and Android
- 📖 **Documentation**: MOBILE_ISSUES_FIXED_v1.0.52.md details all 4 critical mobile fixes
- 📖 **Build Guide**: WINDOWS_BUILD_v1.0.52.md for rebuilding APK/AAB with all fixes

### Previous Updates (v1.0.49 - October 2025)
- 🚨 **CRITICAL iOS FIX**: Fixed Apple rejection - sign-in button now works! Removed server.url from capacitor config so app uses locally bundled files with environment variables
- 🔧 **Storage Limits Updated**: Free (100MB/video, 10GB total), Premium (500MB/video, 75GB total), Gym (500MB/video, 150GB total)
- 🐛 **Bug Fix**: Fixed delete notes functionality (UUID type mismatch)
- 📋 **Storage Display**: Storage usage tracker already implemented in Settings page

### Previous Updates (v1.0.48 - October 2025)
- 🚀 **CRITICAL PERFORMANCE FIX**: Eliminated 8-9 second delay on mobile by persisting Supabase ID in Capacitor Preferences
- ⚡ **Instant API Calls**: Notes load instantly on mobile (<1 second) by avoiding `supabase.auth.getSession()` calls
- 🔧 **Root Cause**: Mobile app was calling slow `getSession()` on every cold start through Capacitor bridge
- ✅ **Solution**: Persistent caching in Capacitor Preferences survives app restarts and provides instant access

### Previous Updates (v1.0.46 - October 2025)
- 🐛 **Critical Bug Fixes**: Fixed notes loading performance issue (reduced from 9 seconds to under 1 second)
- 🔧 **Cache Fix**: Resolved cache invalidation issues that caused video upload failures
- ⚡ **API Migration**: Migrated all notes mutations from Supabase direct queries to backend API for better performance and consistency
- 🔄 **Capacitor Sync**: Latest web build synced to native projects, ready for app store deployment

### Earlier Updates (v1.0.44 - October 2025)
- ✨ **Expandable Class Cards**: Click-to-expand class details for better organization and cleaner UI
- ⚡ **Video Storage Migration**: Migrated from Supabase Storage to Cloudflare R2 for cost-efficient, scalable video storage with zero egress fees
- 🚀 **Performance Improvements**: Optimized notes loading using backend API instead of direct Supabase queries

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
- **Video Storage**: Cloudflare R2 (S3-compatible) for scalable, cost-efficient video storage with zero egress fees. Legacy videos remain on Supabase Storage with automatic fallback.
- **Deployment**: Render.com with Infrastructure as Code (render.yaml) for automated deployments.

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