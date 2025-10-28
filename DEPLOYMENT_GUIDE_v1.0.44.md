# Deployment Guide - Version 1.0.44

## What's New in v1.0.44
- ✅ **Expandable Class Cards**: Click to expand/collapse class details with clean UI
- ✅ **Cloudflare R2 Video Storage**: Migrated from Supabase to R2 for cost-efficient video storage
- ✅ **Optimized Notes Loading**: Faster loading using backend API instead of direct Supabase queries
- ✅ **Bug Fixes**: Various performance improvements

## ✅ Completed Steps
1. ✅ Version bumped to 1.0.44 in both Android and iOS projects
2. ✅ Latest web code synced to native projects (`npx cap sync`)
3. ✅ All changes committed to Git

## 📱 Next Steps: Building & Deploying

### Option A: Build Locally (Requires Setup)

#### Android Build (Requires Android Studio)
If you have Android Studio installed on your Windows machine:

1. **Pull latest code from Git**:
   ```bash
   git pull origin main
   ```

2. **Navigate to android folder**:
   ```bash
   cd android
   ```

3. **Build the AAB file**:
   ```bash
   ./gradlew bundleRelease
   ```

4. **Find your AAB file**:
   Located at: `android/app/build/outputs/bundle/release/app-release.aab`

5. **Upload to Google Play Console**:
   - Go to [Google Play Console](https://play.google.com/console)
   - Select "Jits Journal"
   - Production → Create new release
   - Upload `app-release.aab`
   - Add release notes (mention expandable classes, R2 storage, performance improvements)
   - Submit for review

⚠️ **Note**: Your current signing config references `C:/Users/joe/my-release-key.jks`. Make sure this file exists on your Windows machine.

---

#### iOS Build (Requires Mac OR Use Codemagic)

**Since you don't have a Mac, use Option B (Codemagic) instead!**

If you did have a Mac, you would:
1. Pull latest code
2. Run `cd ios/App && pod install`
3. Open `ios/App/App.xcworkspace` in Xcode
4. Archive and upload to App Store Connect

---

### Option B: Cloud Builds with Codemagic (RECOMMENDED for iOS)

Codemagic allows you to build iOS apps **without a Mac**!

#### Setup Codemagic (One-time setup):

1. **Create account**: Go to [codemagic.io](https://codemagic.io)

2. **Connect your repository**: Link your GitHub/GitLab repo

3. **Add iOS signing certificates**:
   - Generate certificates in Apple Developer account
   - Upload to Codemagic (they have a wizard for this)

4. **Configure workflow**: Use the config in `CODEMAGIC_SETUP_GUIDE.md`

5. **Trigger builds**: 
   - Push to main branch OR
   - Manually trigger in Codemagic dashboard

#### What Codemagic Does:
- ✅ Builds iOS app in the cloud (no Mac needed!)
- ✅ Signs the app with your certificates
- ✅ Can auto-upload to App Store Connect
- ✅ Also supports Android builds if you prefer

**Cost**: Free tier available, paid plans from $40/month

---

### Option C: Use GitHub Actions (Alternative CI/CD)

You can also set up GitHub Actions to build Android apps automatically.

**Android with GitHub Actions**:
1. Store your keystore file as a GitHub Secret
2. Create workflow file (`.github/workflows/android.yml`)
3. Push to trigger builds

**iOS with GitHub Actions**:
Still requires Mac runners (GitHub charges for macOS runners)

---

## 📋 Submission Checklist

### Google Play Store (Android)
- [ ] Version bumped to 1.0.44 ✅ (already done)
- [ ] AAB file built and signed
- [ ] Upload to Google Play Console
- [ ] Update release notes:
  ```
  What's New in v1.0.44:
  - New expandable class cards for better organization
  - Improved video storage performance
  - Faster notes loading
  - Bug fixes and performance improvements
  ```
- [ ] Submit for review (typically approved in 1-3 days)

### Apple App Store (iOS)
- [ ] Version bumped to 1.0.44 ✅ (already done)
- [ ] Build IPA file (via Codemagic or Xcode)
- [ ] Upload to App Store Connect
- [ ] Update What's New:
  ```
  What's New in v1.0.44:
  - Enhanced class tracking with expandable cards
  - Optimized video storage for better performance
  - Improved loading speeds
  - Various bug fixes
  ```
- [ ] Submit for review (typically 1-2 days)

---

## 🔄 Quick Summary

**What's ready NOW**:
- ✅ Code is updated and synced
- ✅ Version numbers bumped to 1.0.44
- ✅ All changes in Git

**What YOU need to do**:

1. **For Android**: 
   - Build locally with Android Studio, OR
   - Set up Codemagic/GitHub Actions for cloud builds
   
2. **For iOS**: 
   - Use Codemagic (recommended since no Mac)
   - Follow `CODEMAGIC_SETUP_GUIDE.md`

3. **Submit to stores**:
   - Upload AAB to Google Play Console
   - Upload IPA to App Store Connect
   - Add release notes
   - Submit for review

---

## 🆘 Need Help?

**Can't build locally?**
→ Use Codemagic (best option for iOS without Mac)

**Don't want to pay for Codemagic?**
→ Use GitHub Actions for Android (free for public repos)

**Want the fastest path?**
→ Install Android Studio on your Windows PC and build Android locally. Use Codemagic for iOS.

---

## 📞 Support Resources

- Codemagic Docs: https://docs.codemagic.io/
- Google Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com/
- Capacitor Docs: https://capacitorjs.com/docs/android
