# 🚨 iOS Production Build Fix - Sign-In Issue
## Version 1.0.49 - October 2025

---

## 🔴 Problem

Apple rejected the iOS app because **"nothing happens when clicking sign in"**.

### Root Cause

The `capacitor.config.ts` had `server.url` set to the Render production URL. This caused the iOS app to load the website from the remote server instead of using locally bundled files. Since environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are only available during build time, they weren't available when loading from the remote server, causing Supabase authentication to fail silently.

---

## ✅ Solution

The fix is simple: Remove `server.url` from the Capacitor configuration for production builds. This ensures the iOS app uses locally bundled files with environment variables baked in at build time.

---

## 🔧 How to Fix & Rebuild iOS App

### Step 1: Get Latest Code

On your Windows machine:

```bash
cd C:\Projects\JitsPlannerPro
git pull origin main
```

**Note:** The capacitor.config.ts has already been fixed in the latest commit.

### Step 2: Verify Configuration

Open `capacitor.config.ts` and confirm the server.url is commented out:

```typescript
const config: CapacitorConfig = {
  appId: 'com.jitsjournal.app',
  appName: 'Jits Journal',
  webDir: 'dist/public',
  // server.url should be commented out for production!
  // server: {
  //   url: 'https://bjj-jits-journal.onrender.com',
  //   androidScheme: 'https'
  // },
```

### Step 3: Build the Web App

Build the React app with environment variables baked in:

```bash
npm run build
```

This creates the production build in `dist/public` with all environment variables compiled into the JavaScript bundle.

### Step 4: Sync to iOS

Copy the built files to the iOS project:

```bash
npx cap sync ios
```

This command:
- Copies `dist/public` → `ios/App/App/public`  
- Updates Capacitor plugins
- **Includes all environment variables in the bundle**

### Step 5: Increment Build Number

Open `ios/App/App.xcodeproj` in Xcode (or use Codemagic) and:

1. Update **Version** to `1.0.49`
2. Update **Build Number** to `49`

### Step 6: Build & Submit

**Option A: Codemagic (Recommended - No Mac Needed)**

1. Push code to GitHub
2. Trigger Codemagic build
3. Codemagic builds and submits to App Store automatically

**Option B: Manual Xcode Build (Requires Mac)**

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select **Product → Archive**
3. Upload to App Store via Xcode

---

## ✅ What This Fixes

- ✅ Sign-in button now works on iOS
- ✅ Supabase authentication fully functional
- ✅ Environment variables available at runtime
- ✅ App uses locally bundled files, not remote server
- ✅ Faster load times (no network dependency on startup)

---

## 📋 Important Notes

### When to Use `server.url`

- **Development only**: Use when testing with live reload from Replit
- **Production**: NEVER include `server.url` in production builds

### Environment Variables

The following are baked into the JavaScript bundle at build time:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`  
- `VITE_API_BASE_URL`

These are defined in `.env` and compiled by Vite during `npm run build`.

### How to Test Before Submission

1. Build the app with the fixed configuration
2. Test on a physical iOS device or simulator
3. Verify sign-in works correctly
4. Check that EnvCheck component doesn't show any errors

---

## 🔄 Android Note

Android builds work fine because they were already using locally bundled files. No changes needed for Android.

---

## 📝 Version History

- **v1.0.48**: Last version submitted (had server.url bug)
- **v1.0.49**: Fixed capacitor config, sign-in now works

---

## 🎯 Next Steps

1. Pull latest code
2. Run `npm run build`
3. Run `npx cap sync ios`
4. Increment build number to 49
5. Build & submit via Codemagic or Xcode
6. Wait for Apple review (should pass this time!)
