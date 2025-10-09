# Google Play AAB Build - Version 6 Update

## Your App Version
- **Version Code**: 6
- **Version Name**: 6.0
- Already configured in `android/app/build.gradle`

---

## ⚡ Quick Build Commands (Copy/Paste for PowerShell)

### Option 1: Cloud Build with EAS (Recommended - No Android Studio needed)

```powershell
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Build AAB for Google Play
eas build --platform android --profile production
```

**What happens**:
1. Code is uploaded to Expo cloud
2. AAB is built in the cloud (~10-15 minutes)
3. You get a download link when complete
4. Download AAB and upload to Google Play Console

**Benefits**:
- ✅ No Android Studio required
- ✅ No local Android SDK setup
- ✅ Builds in the cloud
- ✅ Gets you a signed AAB ready for Google Play

---

### Option 2: Local Build (Requires Android Studio)

```powershell
# Step 1: Build production web app
npm run build

# Step 2: Sync with Capacitor
npx cap sync android

# Step 3: Build AAB
cd android
./gradlew bundleRelease
```

**AAB location**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🔧 Important: Backend URL Configuration

Before building for mobile, ensure the app connects to your Render backend.

### Update capacitor.config.ts:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jitsjournal.app',
  appName: 'Jits Journal',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    url: 'https://bjj-jits-journal.onrender.com' // Add this line
  },
  // ... rest of config
};

export default config;
```

**OR** set environment variable during build:

```powershell
$env:VITE_API_BASE_URL="https://bjj-jits-journal.onrender.com"
npm run build
npx cap sync android
```

---

## 📤 Upload to Google Play Console

1. Go to: https://play.google.com/console
2. Select "Jits Journal" app
3. Navigate to: **Production → Create new release**
4. Upload the AAB file
5. Fill in release notes (e.g., "Bug fixes and performance improvements")
6. Click **Review release** → **Start rollout to production**

---

## 🐛 Troubleshooting

### Error: "eas: command not found"
```powershell
npm install -g eas-cli
```

### Error: "gradlew: command not found" (PowerShell)
```powershell
# Use this instead:
.\gradlew.bat bundleRelease
```

### Error: "ANDROID_HOME not set"
You need Android Studio installed. Use **Option 1 (EAS Build)** instead.

### Mobile app won't connect to backend
Make sure you:
1. Set `VITE_API_BASE_URL` before building
2. OR updated `capacitor.config.ts` with Render URL
3. Rebuilt the app after making changes

---

## ✅ Build Checklist

- [ ] Backend is live on Render: https://bjj-jits-journal.onrender.com
- [ ] capacitor.config.ts has Render URL OR VITE_API_BASE_URL is set
- [ ] Ran `npm run build` to build production frontend
- [ ] Ran `npx cap sync android` to sync to Android project
- [ ] Built AAB using EAS or Gradle
- [ ] Downloaded AAB file
- [ ] Uploaded to Google Play Console
- [ ] Started rollout to production

---

## 🚀 Fastest Path to Google Play Update

```powershell
# 1. Build in cloud
npm install -g eas-cli
eas login
eas build --platform android --profile production

# 2. Wait for build completion (~10-15 min)
# 3. Download AAB from link provided
# 4. Upload to Google Play Console
```

That's it! Your version 6 update will be live on Google Play.
