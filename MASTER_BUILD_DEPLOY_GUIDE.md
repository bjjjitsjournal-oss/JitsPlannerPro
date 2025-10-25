# 🚀 Jits Journal - Master Build & Deploy Guide
## Complete Instructions for Google Play & iOS App Store
**Current Version: 1.0.61**

---

## 📋 Table of Contents

1. [Download Project from Replit](#step-1-download-project-from-replit)
2. [Update Version Number](#step-2-update-version-number)
3. [Build for Android (Google Play)](#step-3-build-for-android-google-play)
4. [Build for iOS (App Store via Codemagic)](#step-4-build-for-ios-app-store)
5. [Upload to Google Play](#step-5-upload-to-google-play)
6. [Upload to iOS App Store](#step-6-upload-to-ios-app-store)

---

## 🎯 STEP 1: Download Project from Replit

### Option A: Download as ZIP (Recommended)

1. **In Replit, click the 3-dot menu** (⋮) in the top-left corner
2. **Click "Download as zip"**
3. **Save to your computer** (e.g., `C:\Users\joe\Downloads\jitsjournal.zip`)
4. **Extract the ZIP file** to a working directory (e.g., `C:\Users\joe\jitsjournal`)

### Option B: Clone from GitHub

```powershell
# Navigate to where you want the project
cd C:\Users\joe

# Clone the repository
git clone https://github.com/YOUR_USERNAME/jitsjournal.git
cd jitsjournal
```

---

## 🔢 STEP 2: Update Version Number

**Current version: 1.0.60 → New version: 1.0.61**

### 2.1 Open PowerShell in Project Directory

```powershell
cd C:\Users\joe\jitsjournal
```

### 2.2 Update Android Version

Edit `android/app/build.gradle`:

Find these lines:
```gradle
versionCode 60
versionName "1.0.60"
```

Change to:
```gradle
versionCode 61
versionName "1.0.61"
```

**PowerShell command to do it automatically:**

```powershell
(Get-Content android/app/build.gradle) -replace 'versionCode 60', 'versionCode 61' -replace 'versionName "1.0.60"', 'versionName "1.0.61"' | Set-Content android/app/build.gradle
```

### 2.3 Update iOS Version (for Codemagic)

Edit `ios/App/App.xcodeproj/project.pbxproj`:

This will be handled automatically by Codemagic, but you can manually update if needed in Xcode.

### 2.4 Update Documentation

Edit `WINDOWS_BUILD_v1.0.52.md` title:
```markdown
# Windows Build Guide - v1.0.61
```

---

## 📱 STEP 3: Build for Android (Google Play)

### 3.1 Prerequisites

Make sure you have:
- ✅ Node.js installed (v18 or higher)
- ✅ Java JDK 17 installed
- ✅ Android Studio installed (or at least Android SDK)
- ✅ Your release keystore file at `C:\Users\joe\my-release-key.jks`

### 3.2 Open PowerShell in Project Directory

```powershell
cd C:\Users\joe\jitsjournal
```

### 3.3 Set Environment Variables

**Copy and paste these commands into PowerShell:**

```powershell
$env:VITE_SUPABASE_URL="https://umotigprfosrrjwpxlnp.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtb3RpZ3ByZm9zcnJqd3B4bG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYyNzc4OTEsImV4cCI6MjA0MTg1Mzg5MX0.pHDnqd_DUl2eKF2qTQmDDDwWUMqfY2_TGf5iXnkELVE"
$env:VITE_API_BASE_URL="https://bjj-jits-journal.onrender.com"
```

### 3.4 Install Dependencies

```powershell
npm install
```

### 3.5 Build the Web App

```powershell
npm run build
```

**Expected output:** `dist` folder created with built files

### 3.6 Verify Environment Variables Were Bundled

```powershell
Select-String -Path "dist/assets/*.js" -Pattern "umotigprfosrrjwpxlnp"
```

**Expected:** Should find matches showing the Supabase URL is in the built files

### 3.7 Sync to Android

```powershell
npx cap sync android
```

**What this does:**
- Copies `dist` folder to `android/app/src/main/assets/public`
- Updates native Android dependencies
- Syncs Capacitor configuration

### 3.8 Build the AAB (Android App Bundle)

```powershell
cd android
./gradlew bundleRelease
```

**Build time:** ~2-5 minutes

**Expected output:**
```
BUILD SUCCESSFUL in 3m 21s
```

### 3.9 Find Your AAB File

The AAB will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

**PowerShell command to open the folder:**

```powershell
explorer android\app\build\outputs\bundle\release
```

### 3.10 Verify AAB File Size

```powershell
(Get-Item android/app/build/outputs/bundle/release/app-release.aab).Length / 1MB
```

**Expected:** ~15-25 MB

---

## 🍎 STEP 4: Build for iOS (App Store via Codemagic)

**Since you don't have a Mac, use Codemagic for cloud iOS builds!**

### 4.1 Prerequisites

Before starting, you need:
- ✅ **Apple Developer Account** ($99/year) - https://developer.apple.com
- ✅ **Codemagic Account** (free) - https://codemagic.io
- ✅ **GitHub Repository** with your code

### 4.2 Push Latest Code to GitHub

```powershell
# Navigate back to project root
cd C:\Users\joe\jitsjournal

# Add all changes
git add .

# Commit with version message
git commit -m "Build v1.0.61 - Ready for app store deployment"

# Push to GitHub
git push origin main
```

### 4.3 Codemagic Setup (First Time Only)

**If you haven't set up Codemagic yet, follow the complete guide:**

📖 **See: CODEMAGIC_SETUP_GUIDE.md** for detailed instructions

**Quick checklist:**
- [ ] Codemagic account created and connected to GitHub
- [ ] Apple Developer certificates configured (automatic signing recommended)
- [ ] App Store Connect API key added to Codemagic
- [ ] App created in App Store Connect
- [ ] `codemagic.yaml` configured with your App Store ID

### 4.4 Trigger iOS Build

**Option A: Automatic (after push to GitHub)**

Codemagic will automatically detect your push to `main` and start building

**Option B: Manual**

1. Go to https://codemagic.io
2. Select your **jitsjournal** project
3. Click **Start new build**
4. Select **ios-release** workflow
5. Select branch: **main**
6. Click **Start new build**

### 4.5 Monitor the Build

**Build steps (8-12 minutes total):**
1. 📦 Install npm dependencies (~2-3 min)
2. 🏗️ Build web application (~1-2 min)
3. 🔄 Sync Capacitor iOS (~30 sec)
4. 📱 Install CocoaPods (~1 min)
5. ✍️ Set up code signing (~30 sec)
6. 🔢 Increment build number (~10 sec)
7. 🎨 Build IPA (~3-5 min)
8. 📤 Upload to TestFlight (automatic)

### 4.6 Download IPA (Optional)

After successful build:
1. Click on the completed build in Codemagic
2. Go to **Artifacts** tab
3. Download the `.ipa` file

**Or it will automatically upload to TestFlight!**

---

## 📤 STEP 5: Upload to Google Play

### 5.1 Open Google Play Console

1. Go to https://play.google.com/console
2. Sign in with your Google Play developer account
3. Select **Jits Journal** app

### 5.2 Create New Release

1. In left sidebar, click **Production** (or **Testing** → **Internal testing** for testing first)
2. Click **Create new release**
3. Upload your AAB file:
   - Click **Upload**
   - Select `android/app/build/outputs/bundle/release/app-release.aab`
   - Wait for upload to complete

### 5.3 Add Release Notes

**Example for v1.0.61:**

```
Version 1.0.61

New Features:
• Updated storage limits: Free (10GB), Premium (75GB), Gym (150GB)
• Fixed gym list refresh issue
• Added gym deletion feature

Bug Fixes:
• Fixed class type display on dashboard
• Fixed submission stats showing 0
• Improved logged classes to show Gi/No-Gi instead of duration

Performance:
• Faster note operations
• Better cache invalidation
```

### 5.4 Review and Rollout

1. Click **Review release**
2. Verify all information is correct
3. Click **Start rollout to Production**
4. Confirm the rollout

**⏱️ Timeline:**
- **Review:** 1-7 days (usually 24-48 hours)
- **Rollout:** Immediate after approval

---

## 🍎 STEP 6: Upload to iOS App Store

### 6.1 Automatic Upload (via Codemagic)

If you configured Codemagic correctly, it will automatically:
- ✅ Upload IPA to App Store Connect
- ✅ Submit to TestFlight
- ✅ Make available to internal testers

### 6.2 Test on TestFlight

1. Go to https://appstoreconnect.apple.com
2. Select **Jits Journal**
3. Go to **TestFlight** tab
4. Add internal testers (yourself and team)
5. Testers receive email invite
6. Install TestFlight app on iPhone
7. Accept invite and test the app

### 6.3 Submit for App Store Review

Once testing is complete:

1. In App Store Connect, go to your app
2. Click **+ Version or Platform** → **iOS**
3. Enter version number: **1.0.61**
4. Fill in required information:
   - **What's New:** (same as Android release notes)
   - **Screenshots:** (if not already uploaded)
   - **Description:** (if not already set)
   - **Keywords:** bjj, brazilian jiu jitsu, training, martial arts
   - **Support URL:** https://jitsjournal.vercel.app
   - **Privacy Policy URL:** (your privacy policy URL)

5. Select the build from TestFlight
6. Click **Add for Review**
7. Answer questionnaire:
   - Uses encryption? **No** (unless you implemented additional encryption)
   - Content rights? **I own all rights**
8. Click **Submit for Review**

**⏱️ Timeline:**
- **Review:** 1-3 days (usually 24-48 hours)
- **Available:** Immediate after approval

---

## ✅ Verification Checklist

### Before Building

- [ ] Version number updated to 1.0.61 in `android/app/build.gradle`
- [ ] Latest code pushed to GitHub (for iOS build)
- [ ] All environment variables set in PowerShell
- [ ] `npm install` completed successfully

### After Android Build

- [ ] AAB file exists at `android/app/build/outputs/bundle/release/app-release.aab`
- [ ] AAB file size is reasonable (~15-25 MB)
- [ ] Supabase URL verified in built files

### After iOS Build (Codemagic)

- [ ] Build succeeded (green checkmark)
- [ ] IPA uploaded to TestFlight
- [ ] TestFlight build appears in App Store Connect

### After Upload

- [ ] Google Play shows new version in testing/production
- [ ] TestFlight shows new build
- [ ] Release notes added
- [ ] App tested on real device

---

## 🆘 Troubleshooting

### Android Build Fails

**Error: "SDK location not found"**

**Solution:**
Create `android/local.properties`:
```
sdk.dir=C:/Users/joe/AppData/Local/Android/Sdk
```

**Error: "Keystore not found"**

**Solution:**
Verify keystore path in `android/app/build.gradle`:
```gradle
storeFile file('C:/Users/joe/my-release-key.jks')
```

**Error: "Task failed with an exception"**

**Solution:**
Clean and rebuild:
```powershell
cd android
./gradlew clean
./gradlew bundleRelease
```

### iOS Build Fails (Codemagic)

**Error: "No signing certificate found"**

**Solution:**
1. Go to Codemagic → Settings → iOS code signing
2. Enable automatic code signing
3. Re-run build

**Error: "Bundle identifier mismatch"**

**Solution:**
Verify Bundle ID matches in:
- `capacitor.config.ts`: `appId: "com.jitsjournal.app"`
- Apple Developer Portal: `com.jitsjournal.app`
- Codemagic certificate

### Environment Variables Not Bundled

**Symptom:** App shows blank screen or "Server error"

**Solution:**
```powershell
# Set environment variables again
$env:VITE_SUPABASE_URL="https://umotigprfosrrjwpxlnp.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtb3RpZ3ByZm9zcnJqd3B4bG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYyNzc4OTEsImV4cCI6MjA0MTg1Mzg5MX0.pHDnqd_DUl2eKF2qTQmDDDwWUMqfY2_TGf5iXnkELVE"
$env:VITE_API_BASE_URL="https://bjj-jits-journal.onrender.com"

# Rebuild
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```

---

## 📊 Complete PowerShell Script (Copy & Paste)

**Use this for future builds - just update version number:**

```powershell
# ============================================
# Jits Journal - Android Build Script v1.0.61
# ============================================

# 1. Navigate to project
cd C:\Users\joe\jitsjournal

# 2. Update version (change 60 to 61)
(Get-Content android/app/build.gradle) -replace 'versionCode 60', 'versionCode 61' -replace 'versionName "1.0.60"', 'versionName "1.0.61"' | Set-Content android/app/build.gradle

# 3. Set environment variables
$env:VITE_SUPABASE_URL="https://umotigprfosrrjwpxlnp.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtb3RpZ3ByZm9zcnJqd3B4bG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYyNzc4OTEsImV4cCI6MjA0MTg1Mzg5MX0.pHDnqd_DUl2eKF2qTQmDDDwWUMqfY2_TGf5iXnkELVE"
$env:VITE_API_BASE_URL="https://bjj-jits-journal.onrender.com"

# 4. Install dependencies
npm install

# 5. Build web app
npm run build

# 6. Verify credentials bundled
Write-Host "`n=== Verifying Supabase URL in build ===" -ForegroundColor Cyan
Select-String -Path "dist/assets/*.js" -Pattern "umotigprfosrrjwpxlnp" | Select-Object -First 1

# 7. Sync to Android
npx cap sync android

# 8. Build AAB
Write-Host "`n=== Building Android App Bundle ===" -ForegroundColor Cyan
cd android
./gradlew bundleRelease

# 9. Open output folder
Write-Host "`n=== Build Complete! ===" -ForegroundColor Green
explorer app\build\outputs\bundle\release

# 10. Show file size
$aabSize = (Get-Item app/build/outputs/bundle/release/app-release.aab).Length / 1MB
Write-Host "AAB Size: $($aabSize.ToString('0.00')) MB" -ForegroundColor Green

Write-Host "`nAAB file location: android\app\build\outputs\bundle\release\app-release.aab" -ForegroundColor Yellow
```

---

## 🎯 Quick Reference

### File Locations

- **Android AAB:** `android/app/build/outputs/bundle/release/app-release.aab`
- **Android Version:** `android/app/build.gradle` (lines 14-15)
- **iOS Version:** Handled by Codemagic automatically
- **Environment Config:** Set in PowerShell before `npm run build`

### Important URLs

- **Google Play Console:** https://play.google.com/console
- **App Store Connect:** https://appstoreconnect.apple.com
- **Codemagic Dashboard:** https://codemagic.io
- **Vercel (Web):** https://vercel.com/dashboard
- **Render (Backend):** https://dashboard.render.com

### Version History

- **1.0.60:** Fixed notes, gym management, dashboard stats
- **1.0.61:** Updated storage limits (10GB/75GB/150GB), fixed UI issues

---

## 🚀 You're Ready to Ship!

**Android:** Build AAB → Upload to Play Store → Review (1-7 days) → Live!

**iOS:** Push to GitHub → Codemagic builds → TestFlight → Submit → Review (1-3 days) → Live!

**Questions?** Check the troubleshooting section or existing guides:
- `WINDOWS_BUILD_v1.0.52.md` - Detailed Windows build info
- `CODEMAGIC_SETUP_GUIDE.md` - Complete iOS/Codemagic setup
- `IOS_PRODUCTION_BUILD_FIX.md` - iOS-specific fixes

---

**Good luck with your launch! 🥋📱**
