# BUILD INSTRUCTIONS - v1.0.71 (PERFORMANCE FIX)

## 🚀 What's New in v1.0.71
**CRITICAL PERFORMANCE IMPROVEMENT: Local JWT Verification**
- Eliminated 1.5 second authentication overhead on every API request
- Notes page now loads in 2-3 seconds instead of 7 seconds
- 3-4x faster authentication across the entire app

---

## ✅ PRE-BUILD CHECKLIST

Before building, ensure you have:
1. ✅ Pushed latest code to GitHub: `git push origin main`
2. ✅ Added `SUPABASE_JWT_SECRET` to Render.com environment variables
3. ✅ Verified production site is working at https://jitsjournal.vercel.app
4. ✅ Version updated to 1.0.71 in:
   - `android/app/build.gradle` (versionCode 71, versionName "1.0.71")
   - `ios/App/App.xcodeproj/project.pbxproj` (MARKETING_VERSION = 1.0.71)

---

## 📱 ANDROID BUILD (AAB for Google Play Store)

### Step 1: Build the Web App
```bash
npm run build
```

### Step 2: Sync to Android
```bash
npx cap sync android
```

### Step 3: Build AAB (App Bundle)
```bash
cd android
./gradlew bundleRelease
```

### Step 4: Find Your AAB
The AAB file will be located at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Step 5: Upload to Google Play Console
1. Go to: https://play.google.com/console
2. Select "Jits Journal" app
3. Go to **Production** → **Create new release**
4. Upload `app-release.aab`
5. Add release notes:
   ```
   v1.0.71 - PERFORMANCE UPDATE
   • 3-4x faster app loading and authentication
   • Notes page loads in 2-3 seconds (was 7 seconds)
   • Improved overall app responsiveness
   • Bug fixes and stability improvements
   ```
6. Click **Save** → **Review release** → **Start rollout to Production**

---

## 🍎 iOS BUILD (Using Codemagic - No Mac Needed!)

### Option A: Codemagic Cloud Build (RECOMMENDED)

1. **Push to GitHub** (triggers automatic build):
   ```bash
   git add -A
   git commit -m "v1.0.71 - Performance fix: Local JWT verification"
   git push origin main
   ```

2. **Monitor Build**:
   - Go to: https://codemagic.io
   - Select your project
   - Watch the build progress (~15-20 minutes)

3. **Download IPA**:
   - Once build completes, download the `.ipa` file
   - Codemagic can also auto-submit to App Store if configured

4. **Submit to App Store**:
   - Go to: https://appstoreconnect.apple.com
   - Select "Jits Journal"
   - Go to **TestFlight** → Upload the IPA
   - Add release notes:
     ```
     v1.0.71 - PERFORMANCE UPDATE
     • 3-4x faster app loading and authentication
     • Notes page loads in 2-3 seconds (was 7 seconds)
     • Improved overall app responsiveness
     • Bug fixes and stability improvements
     ```
   - Submit for review

### Option B: Manual Build (Requires Mac)

If you have access to a Mac, follow these steps:

1. **Build Web App**:
   ```bash
   npm run build
   ```

2. **Sync to iOS**:
   ```bash
   npx cap sync ios
   ```

3. **Open in Xcode**:
   ```bash
   npx cap open ios
   ```

4. **In Xcode**:
   - Select your developer account under **Signing & Capabilities**
   - Select **Any iOS Device** as the build target
   - Go to **Product** → **Archive**
   - Wait for archive to complete (~10-15 minutes)

5. **Upload to App Store**:
   - Click **Distribute App**
   - Choose **App Store Connect**
   - Click **Upload**
   - Add release notes in App Store Connect

---

## 🔍 POST-BUILD VERIFICATION

### Android Testing:
1. Install the AAB on a test device (use Google Play Console internal testing)
2. Test login/signup
3. Navigate to Notes page - should load in 2-3 seconds
4. Test video uploads
5. Verify all features work correctly

### iOS Testing:
1. Install via TestFlight
2. Test login/signup
3. Navigate to Notes page - should load in 2-3 seconds
4. Test video uploads
5. Verify all features work correctly

---

## 📝 IMPORTANT NOTES

### For Android:
- **Keystore Location**: `C:/Users/joe/my-release-key.jks`
- **Keystore Password**: `romeodog`
- **Key Alias**: `your_key_alias`
- Version Code MUST increment with each release (now at 71)

### For iOS:
- **Bundle ID**: `com.jitsjournal.app`
- **App ID**: Must match your Apple Developer account
- Version MUST match App Store Connect (now at 1.0.71)
- Export compliance: Encryption set to NO in Info.plist

### Common Issues:
1. **Build fails**: Run `npm run build` first
2. **Gradle errors**: Run `./gradlew clean` then try again
3. **Xcode signing issues**: Verify developer account is active
4. **Codemagic build fails**: Check CODEMAGIC_SETUP_GUIDE.md

---

## 🎯 SUCCESS CRITERIA

Build is successful when:
- ✅ AAB/IPA builds without errors
- ✅ Version shows as 1.0.71 in app stores
- ✅ All features work correctly on mobile
- ✅ No console errors or crashes
- ✅ Notes page loads in 2-3 seconds (major performance improvement!)

---

## 📚 ADDITIONAL RESOURCES

- Android build guide: WINDOWS_BUILD_v1.0.52.md
- iOS build guide: IOS_BUILD_GUIDE.md
- Codemagic setup: CODEMAGIC_SETUP_GUIDE.md
- iOS production fix: IOS_PRODUCTION_BUILD_FIX.md

---

**Version**: 1.0.71  
**Build Date**: October 25, 2025  
**Performance Improvement**: 3-4x faster authentication
