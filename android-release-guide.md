# Google Play Store Submission Guide for Jits Journal

## Prerequisites Completed ✅
- ✅ Capacitor configuration setup
- ✅ App icons (192x192, 512x512) created
- ✅ Manifest.json with proper app details
- ✅ Privacy policy and terms of service
- ✅ Subscription system with Stripe integration
- ✅ Progressive Web App capabilities

## Next Steps for Google Play Store Submission

### 1. Initialize Capacitor Project
```bash
npx cap init "Jits Journal" "com.jitsjournal.app"
npx cap add android
```

### 2. Build Production App
```bash
npm run build
npx cap sync
```

### 3. Generate Signed APK/AAB
You'll need to create a signing key for Google Play:
```bash
# Create keystore (do this once)
keytool -genkey -v -keystore jits-journal-key.keystore -alias jits-journal -keyalg RSA -keysize 2048 -validity 10000

# Build signed release
cd android
./gradlew assembleRelease
# or for AAB (recommended):
./gradlew bundleRelease
```

### 4. Google Play Console Setup
1. Create developer account ($25 one-time fee)
2. Upload AAB/APK file
3. Add app store listing details
4. Set up content rating
5. Configure pricing & distribution

### 5. Required App Store Assets
- High-res icon (512x512) ✅
- Feature graphic (1024x500) - Create this
- Screenshots (at least 2) - Create these
- App description - Written below

## App Store Listing Content

### App Title
Jits Journal - BJJ Training Companion

### Short Description
Track your Brazilian Jiu-Jitsu training progress with class logging, belt tracking, and technique notes.

### Full Description
Transform your Brazilian Jiu-Jitsu journey with Jits Journal, the ultimate training companion designed by practitioners, for practitioners.

**Key Features:**
🥋 **Class Tracking** - Log training sessions with duration, techniques, and notes
📊 **Weekly Goals** - Set and track your training commitments
🎯 **Belt Progression** - Track promotions and stripe achievements
📝 **Technique Notes** - Document moves with video attachments
🤝 **Social Features** - Share knowledge with training partners
📱 **Offline Ready** - Works without internet connection
💪 **Subscription Plans** - Premium features for serious practitioners

**Perfect for:**
- BJJ practitioners of all levels
- Students tracking their progress
- Instructors monitoring student development
- Academies wanting organized training data

**Premium Features:**
- Unlimited class logging
- Video attachments for technique notes
- Advanced progress analytics
- Social sharing capabilities

Start your journey to mastery today!

### Keywords
brazilian jiu jitsu, bjj, martial arts, training, fitness, sports, progress tracking, belt progression, technique notes, grappling

### Category
Health & Fitness

### Content Rating
Everyone

### App Permissions Required
- Internet access (for syncing data)
- Storage (for video attachments)
- Camera (for video recording)

## Important Notes
- Make sure all environment variables are properly configured
- Test thoroughly on physical Android devices
- Ensure subscription system works correctly
- Verify offline functionality
- Test all user flows before submission

## Files Ready for Submission
- App manifest with proper metadata
- Privacy policy accessible at /privacy
- Terms of service accessible at /terms
- Contact information and support email
- Subscription system with proper billing