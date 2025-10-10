#!/bin/bash

# Build script for Android APK/AAB generation
echo "🚀 Starting Android build process for Jits Journal..."

# Step 1: Build production web app
echo "📦 Building production web app..."
npm run build

# Step 2: Initialize Capacitor (run once)
echo "⚡ Initializing Capacitor..."
npx cap init "Jits Journal" "com.jitsjournal.app" --web-dir=dist

# Step 3: Add Android platform (run once)
echo "🤖 Adding Android platform..."
npx cap add android

# Step 4: Sync web app to native project
echo "🔄 Syncing web app to native project..."
npx cap sync

# Step 5: Build signed release
echo "🏗️ Building signed release..."
echo "Note: Make sure you have created a keystore file first!"
echo "To create keystore: keytool -genkey -v -keystore jits-journal-key.keystore -alias jits-journal -keyalg RSA -keysize 2048 -validity 10000"

cd android
# Build APK
./gradlew assembleRelease

# Build AAB (recommended for Google Play)
./gradlew bundleRelease

echo "✅ Build complete! Check android/app/build/outputs/ for APK and AAB files"
echo "📱 To open in Android Studio: npx cap open android"