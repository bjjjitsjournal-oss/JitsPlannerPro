# Android Blank Screen Fix - Missing Environment Variables

## Problem
After building and installing the new v1.0.49 Android app, you get a blank white screen. This happens because the `.env` file with Supabase credentials wasn't on your Windows machine when you built the app.

## Root Cause
When you run `npm run build` on Windows, Vite needs the environment variables from a `.env` file to bake them into the JavaScript bundle. Without these variables, Supabase can't initialize, causing a blank screen.

## Solution

### Step 1: Create .env file on Windows

On your Windows machine at `C:\Projects\JitsPlannerPro`, create a file called `.env` with this exact content:

```
VITE_SUPABASE_URL=https://umotigprfosrrjwpxlnp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtb3RpZ3ByZm9zcnJqd3B4bG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAzMzQ4NDAsImV4cCI6MjAzNTkxMDg0MH0.d5yLGYOSzwvf0a2mR8XMIJo9mxgOAXZqSW8E6QdO7QU
VITE_API_BASE_URL=https://bjj-jits-journal.onrender.com
```

**How to create it:**
1. Open Notepad (or VS Code)
2. Paste the above content
3. Save as `.env` (with the dot at the beginning, no .txt extension!)
4. Save it in `C:\Projects\JitsPlannerPro` folder

**IMPORTANT:** Make sure it's named `.env` exactly, not `.env.txt`. In Notepad, choose "All Files (*.*)" when saving, not "Text Documents".

### Step 2: Rebuild the Android app

Now rebuild with the environment variables included:

```powershell
cd C:\Projects\JitsPlannerPro

# Clean old build
rm -r -fo dist
rm -r -fo android/app/build

# Build with environment variables
npm run build

# Sync to Android
npx cap sync android

# Build AAB
cd android
.\gradlew bundleRelease
```

### Step 3: Verify the build contains Supabase credentials

Before uploading to Google Play, verify the credentials are in the bundle:

```powershell
# This should find the Supabase URL in the JavaScript bundle
Select-String -Path "dist/public/assets/index-*.js" -Pattern "umotigprfosrrjwpxlnp"
```

If you see `umotigprfosrrjwpxlnp` in the output, the build is good! If not, the .env file isn't being read.

### Step 4: Upload to Google Play

The new AAB will be at:
`C:\Projects\JitsPlannerPro\android\app\build\outputs\bundle\release\app-release.aab`

Upload this to Google Play Console. Users who update will get a working app!

---

## Why This Happened

1. On Replit, the `.env` file exists and gets used when building
2. When you pushed to GitHub, `.env` wasn't pushed (it's in `.gitignore` for security)
3. When you pulled to Windows, there was no `.env` file there
4. So `npm run build` on Windows created a bundle WITHOUT the Supabase credentials
5. The Android app loaded but couldn't initialize Supabase, resulting in a blank screen

---

## Testing the Fix

After rebuilding with the `.env` file:
1. Install the new AAB on your Samsung phone (via Google Play internal testing or adb)
2. Open the app
3. You should see the login screen (not a blank white screen)
4. Sign in should work correctly

---

## For Future Builds

**Always make sure the `.env` file exists on your Windows machine before building!**

You can verify it's there:
```powershell
cd C:\Projects\JitsPlannerPro
cat .env
```

Should output:
```
VITE_SUPABASE_URL=https://umotigprfosrrjwpxlnp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_API_BASE_URL=https://bjj-jits-journal.onrender.com
```

---

## Quick Reference

**Good Build (with .env):**
```
✓ .env file exists on Windows
✓ npm run build → Supabase credentials baked in
✓ npx cap sync android
✓ gradlew bundleRelease
✓ App works!
```

**Bad Build (without .env):**
```
✗ No .env file on Windows
✗ npm run build → No Supabase credentials
✗ npx cap sync android
✗ gradlew bundleRelease
✗ App shows blank white screen!
```
