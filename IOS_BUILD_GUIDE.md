# iOS App Build & Submission Guide
## Jits Journal - Version 1.0.43

---

## 📋 Prerequisites

Before building the iOS app, ensure you have:

1. **Mac Computer** running macOS (required for Xcode)
2. **Xcode** (latest version from Mac App Store)
3. **Apple Developer Account** ($99/year)
4. **CocoaPods** installed: `sudo gem install cocoapods`
5. **Git** configured on your Mac

---

## 🚀 Step 1: Get the Latest Code

On your Mac, open Terminal and run:

```bash
# Navigate to your projects folder
cd ~/Projects

# Clone or pull latest code
git clone https://github.com/YOUR_USERNAME/jitsjournal.git
# OR if already cloned:
cd jitsjournal
git pull origin main
```

---

## 🔧 Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install iOS CocoaPods dependencies
cd ios/App
pod install
cd ../..
```

**Note:** If `pod install` shows errors, try:
```bash
cd ios/App
pod deintegrate
pod install
cd ../..
```

---

## 📱 Step 3: Build the Web App

Build the React/Vite frontend:

```bash
npm run build
```

This creates the production build in `dist/` folder.

---

## 🔄 Step 4: Sync Capacitor

Copy the web build to iOS platform:

```bash
npx cap sync ios
```

This command:
- Copies `dist/public` → `ios/App/App/public`
- Updates Capacitor configuration
- Syncs native plugins

---

## 🎨 Step 5: Open in Xcode

```bash
npx cap open ios
```

This opens the iOS project in Xcode.

**Alternative:** Manually open `ios/App/App.xcworkspace` in Xcode

⚠️ **Important:** Open the `.xcworkspace` file, NOT the `.xcodeproj` file!

---

## ⚙️ Step 6: Configure Xcode Project

### 6.1 Select Your Team

1. In Xcode, select the **App** target
2. Go to **Signing & Capabilities** tab
3. Under **Team**, select your Apple Developer account
4. Xcode will automatically generate provisioning profiles

### 6.2 Verify Settings

Check these settings in Xcode:

- **Bundle Identifier:** `com.jitsjournal.app`
- **Version:** `1.0.43`
- **Build Number:** `43`
- **Deployment Target:** `iOS 14.0`

### 6.3 Update Server URL (IMPORTANT!)

If building for production, update the server URL:

1. Open `capacitor.config.ts`
2. Change the `server.url` to your production URL
3. Re-run `npx cap sync ios`

**For production build:**
```typescript
server: {
  url: 'https://your-production-url.com',
  androidScheme: 'https'
}
```

---

## 🏗️ Step 7: Build the App

### Option A: Build for Testing (Simulator)

1. In Xcode, select a simulator (e.g., iPhone 15)
2. Click the **Play** button (⌘R)
3. Test the app in the simulator

### Option B: Build for Device Testing

1. Connect your iPhone via USB
2. Select your device in Xcode
3. Click the **Play** button (⌘R)
4. First time: Trust the developer certificate on your iPhone

### Option C: Build for App Store Distribution

1. In Xcode menu: **Product** → **Archive**
2. Wait for build to complete (5-10 minutes)
3. The **Organizer** window will open automatically

---

## 📤 Step 8: Upload to App Store Connect

### 8.1 Distribute the Archive

1. In the Organizer window, select your latest archive
2. Click **Distribute App**
3. Select **App Store Connect**
4. Click **Upload**
5. Xcode will validate and upload (10-15 minutes)

### 8.2 Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+ (New App)**
3. Fill in the details:
   - **Platform:** iOS
   - **Name:** Jits Journal
   - **Primary Language:** English
   - **Bundle ID:** com.jitsjournal.app
   - **SKU:** jitsjournal-ios (or any unique identifier)
4. Click **Create**

### 8.3 Configure App Information

**App Information:**
- **Category:** Health & Fitness
- **Subcategory:** Fitness & Training
- **Content Rights:** Select appropriate option

**Pricing and Availability:**
- **Price:** Free
- **Availability:** All countries

**App Privacy:**
- Add privacy policy URL
- Complete privacy questions (data collection, usage, etc.)

---

## 💳 Step 9: Configure In-App Purchases

### 9.1 Create Subscription Group

1. In App Store Connect, go to your app
2. Click **In-App Purchases**
3. Click **+ (Create)**
4. Select **Auto-Renewable Subscription**
5. Create a **Subscription Group** named "BJJ Training Plans"

### 9.2 Add Subscriptions

**Subscription 1: BJJ Enthusiast**
- **Product ID:** `bjj_enthusiast_monthly`
- **Duration:** 1 Month
- **Price:** $9.99 USD (or local equivalent)
- **Localized Display Name:** BJJ Enthusiast
- **Localized Description:** Track classes, take notes, and access video library

**Subscription 2: Gym Pro**
- **Product ID:** `gym_pro_monthly`
- **Duration:** 1 Month
- **Price:** $19.99 USD (or local equivalent)
- **Localized Display Name:** Gym Pro
- **Localized Description:** All Enthusiast features plus gym community, game plans, and AI insights

---

## 🔗 Step 10: Configure RevenueCat

### 10.1 Add iOS App to RevenueCat

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Select your project
3. Go to **Apps** → **Add New**
4. Select **iOS**
5. Enter **Bundle ID:** `com.jitsjournal.app`
6. Click **Add App**

### 10.2 Connect to App Store Connect

1. In RevenueCat, go to **Integrations** → **App Store**
2. Upload your **App Store Connect API Key**:
   - In App Store Connect, go to **Users and Access**
   - Click **Keys** → **App Store Connect API**
   - Generate a new key with **App Manager** role
   - Download the `.p8` file
3. Upload to RevenueCat along with:
   - Issuer ID
   - Key ID
   - Bundle ID

### 10.3 Configure Entitlements

1. In RevenueCat, go to **Entitlements**
2. Create entitlements:
   - `enthusiast` - For BJJ Enthusiast tier
   - `gym_pro` - For Gym Pro tier
3. Link each subscription product to its entitlement

### 10.4 Configure Offerings

1. Go to **Offerings** → **Create New**
2. Identifier: `default`
3. Add both subscription products
4. Save

---

## 📸 Step 11: Prepare App Store Assets

### 11.1 App Screenshots (Required Sizes)

You need screenshots for:
- **6.7" Display (iPhone 15 Pro Max):** 1290 x 2796 pixels
- **6.5" Display (iPhone 14 Plus):** 1284 x 2778 pixels
- **5.5" Display (iPhone 8 Plus):** 1242 x 2208 pixels

**Tip:** Use iOS Simulator to capture screenshots:
1. Run app in simulator
2. Navigate to key screens
3. Press ⌘S to save screenshot

**Recommended screenshots:**
1. Dashboard with class statistics
2. Class logging interface
3. Notes with rich text editor
4. Belt progression tracker
5. Video search results
6. Subscription tiers

### 11.2 App Preview Video (Optional but Recommended)

- **Duration:** 15-30 seconds
- **Format:** MP4 or MOV
- **Same sizes as screenshots**
- Show key features in action

### 11.3 App Icon

Already configured! Located at:
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`
- **Size:** 1024x1024 pixels

---

## 📝 Step 12: Submit for Review

### 12.1 Complete App Information

1. In App Store Connect, select your app
2. Click **+ Version** → Enter `1.0.43`
3. Fill in all required fields:

**Version Information:**
- **What's New:** "Initial release of Jits Journal - Your BJJ training companion"
- **Promotional Text:** Brief tagline (optional)
- **Description:** Full app description highlighting features
- **Keywords:** bjj, jiu jitsu, training, martial arts, fitness, tracker, journal
- **Support URL:** Your support website
- **Marketing URL:** Your main website (optional)

**Rating:**
- Complete the questionnaire
- Likely rating: 4+ (No objectionable content)

**App Review Information:**
- **Sign-in required:** Yes
- **Demo Account:** Provide test credentials:
  - Email: `test@jitsjournal.com`
  - Password: `TestPass123!`
- **Contact Information:** Your email and phone
- **Notes:** "RevenueCat handles subscriptions. Test subscriptions use Sandbox environment."

### 12.2 Select Build

1. Click **Build** section
2. Select the build you uploaded (1.0.43)
3. Click **Done**

### 12.3 Submit for Review

1. Click **Add for Review**
2. Review all information
3. Click **Submit for Review**

**Timeline:**
- Review usually takes 1-3 days
- You'll receive email updates
- Check App Store Connect for status

---

## 🔄 Step 13: Testing with TestFlight (Optional but Recommended)

Before submitting for review, test with TestFlight:

1. In App Store Connect, go to **TestFlight** tab
2. Select your build
3. Add internal testers (up to 100)
4. Add external testers (requires Beta App Review)
5. Testers receive invite via email
6. Install TestFlight app from App Store
7. Testers can install and test your app

**Benefits:**
- Real device testing
- Subscription testing in Sandbox
- Gather feedback before public release

---

## 🎉 Step 14: After Approval

### 14.1 Release the App

Options:
1. **Manual Release:** Control when app goes live
2. **Automatic Release:** Goes live immediately after approval
3. **Scheduled Release:** Set a specific date/time

### 14.2 Monitor Performance

- Check **App Analytics** in App Store Connect
- Monitor **RevenueCat Dashboard** for subscription metrics
- Respond to user reviews

### 14.3 Update App Store Listing

You can update these without new build:
- Description
- Keywords
- Screenshots
- What's New

---

## 🔧 Troubleshooting

### Build Errors

**"No signing certificate found"**
- Solution: Select your Team in Xcode's Signing & Capabilities

**"CocoaPods could not find compatible versions"**
```bash
cd ios/App
rm Podfile.lock
pod repo update
pod install
```

**"Module 'Capacitor' not found"**
```bash
npx cap sync ios
cd ios/App
pod install
```

### Upload Errors

**"Invalid Bundle"**
- Check Bundle ID matches App Store Connect
- Verify version/build number is higher than previous
- Ensure all required assets are present

**"Missing Privacy Description"**
- Add required privacy keys to `Info.plist`
- Camera, Photo Library, Location (if used)

### Subscription Errors

**Subscriptions not appearing**
- Check RevenueCat configuration
- Verify products are approved in App Store Connect
- Test in Sandbox environment first
- Clear app data and reinstall

---

## 📱 Quick Build Script

Save this as `build-ios.sh` in your project root:

```bash
#!/bin/bash

echo "🏗️  Building Jits Journal iOS v1.0.43"
echo ""

# Build web app
echo "📦 Building web app..."
npm run build

# Sync Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync ios

# Install pods
echo "🔧 Installing CocoaPods..."
cd ios/App
pod install
cd ../..

# Open Xcode
echo "🎨 Opening Xcode..."
npx cap open ios

echo ""
echo "✅ Build preparation complete!"
echo "📱 Now in Xcode:"
echo "   1. Select your Team"
echo "   2. Connect device or select simulator"
echo "   3. Click Run (⌘R) to test"
echo "   4. Product → Archive to submit"
```

Make executable: `chmod +x build-ios.sh`

Run: `./build-ios.sh`

---

## 📞 Support

**Apple Developer Support:**
- https://developer.apple.com/support/

**RevenueCat Documentation:**
- https://docs.revenuecat.com/docs/ios-native-apps

**Capacitor iOS Documentation:**
- https://capacitorjs.com/docs/ios

---

## 🎯 Checklist Before Submission

- [ ] Code builds without errors
- [ ] Tested on real device
- [ ] Subscriptions work in Sandbox
- [ ] All screenshots uploaded
- [ ] App description written
- [ ] Privacy policy URL added
- [ ] Demo account credentials provided
- [ ] RevenueCat configured
- [ ] In-app purchases created
- [ ] Version number: 1.0.43
- [ ] Bundle ID: com.jitsjournal.app

---

**Good luck with your iOS submission! 🥋🚀**
