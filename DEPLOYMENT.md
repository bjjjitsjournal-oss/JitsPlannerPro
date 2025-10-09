# Deployment Guide for Jits Journal

## ⚠️ CRITICAL: Supabase Storage Setup Required

**Before deploying**, you MUST set up Supabase Storage for video uploads. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

**Quick setup:**
1. Create a `videos` bucket in Supabase Storage (public)
2. Add upload/read policies (see SUPABASE_SETUP.md)
3. This fixes Vercel's 4.5MB request body limit issue

## Frontend Deployment to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

4. **Required Environment Variables in Vercel**:
   Go to your Vercel project settings → Environment Variables and add:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `VERCEL_FORCE_NO_BUILD_CACHE=1` - Forces fresh builds

## Android AAB Build for Google Play Store

### Option 1: Using EAS Build (Cloud Build - Recommended)

1. **Install EAS CLI** (already installed in package.json):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure the project**:
   ```bash
   eas build:configure
   ```

4. **Build the AAB**:
   ```bash
   eas build --platform android --profile production
   ```

5. The AAB will be built in the cloud and you'll get a download link when complete.

### Option 2: Local Build (Requires Android Studio)

1. **Install Android Studio** with Android SDK

2. **Set ANDROID_HOME environment variable**:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

3. **Build the app**:
   ```bash
   npm run build
   npx cap sync android
   cd android
   ./gradlew bundleRelease
   ```

4. AAB will be in `android/app/build/outputs/bundle/release/app-release.aab`

## Backend Migration to Supabase Edge Functions

**Note**: Your current Express backend in `server/` needs to be migrated to Supabase Edge Functions for full serverless deployment.

### Steps:
1. Convert each Express route to a Deno-based Edge Function
2. Deploy functions to Supabase
3. Update frontend API calls to use Edge Function URLs
4. This requires significant refactoring - plan accordingly

## Post-Deployment Checklist

- [ ] Frontend deployed to Vercel
- [ ] All environment variables configured
- [ ] AAB uploaded to Google Play Console
- [ ] Backend migrated to Supabase Edge Functions (pending)
- [ ] Test the production app thoroughly
- [ ] Plans/Game Plans feature re-enabled after improvements
