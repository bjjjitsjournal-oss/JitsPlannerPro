#!/bin/bash

# Jits Journal iOS Build Script
# Version 1.0.43

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🥋 Jits Journal iOS Build - v1.0.43"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Build web app
echo "📦 Step 1/4: Building web app..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Web build complete"
echo ""

# Step 2: Sync Capacitor
echo "🔄 Step 2/4: Syncing Capacitor to iOS..."
npx cap sync ios
if [ $? -ne 0 ]; then
    echo "❌ Capacitor sync failed!"
    exit 1
fi
echo "✅ Capacitor sync complete"
echo ""

# Step 3: Install CocoaPods
echo "🔧 Step 3/4: Installing CocoaPods dependencies..."
cd ios/App
pod install
if [ $? -ne 0 ]; then
    echo "⚠️  Pod install had issues. Trying pod repo update..."
    pod repo update
    pod install
fi
cd ../..
echo "✅ CocoaPods install complete"
echo ""

# Step 4: Open Xcode
echo "🎨 Step 4/4: Opening Xcode..."
npx cap open ios

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ BUILD PREPARATION COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Next steps in Xcode:"
echo "   1️⃣  Select your Apple Developer Team"
echo "   2️⃣  Connect iPhone or select simulator"
echo "   3️⃣  Click Run (⌘R) to test"
echo "   4️⃣  Product → Archive to submit to App Store"
echo ""
echo "📖 Full guide: See IOS_BUILD_GUIDE.md"
echo ""
echo "🔑 Important Configuration:"
echo "   • Bundle ID: com.jitsjournal.app"
echo "   • Version: 1.0.43"
echo "   • Build: 43"
echo "   • Min iOS: 14.0"
echo ""
echo "💳 Subscription Products to Create:"
echo "   • bjj_enthusiast_monthly ($9.99)"
echo "   • gym_pro_monthly ($19.99)"
echo ""
echo "🚀 Good luck with your iOS submission!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
