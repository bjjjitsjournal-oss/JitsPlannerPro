
#!/bin/bash

echo "🗂️ Creating zip packages for Jits Journal project..."
echo "=================================================="

# Create a temp directory for organizing files
mkdir -p zip-packages

# Package 1: Core application (client + server + shared)
echo "📦 Creating Package 1: Core Application..."
zip -r zip-packages/jits-journal-core.zip \
  client/ \
  server/ \
  shared/ \
  *.json \
  *.ts \
  *.js \
  *.md \
  .replit \
  -x "*/node_modules/*" "*/dist/*" "*/build/*" "*/.next/*" "*/coverage/*"

# Package 2: Android packages and build files
echo "📦 Creating Package 2: Android Build Packages..."
zip -r zip-packages/jits-journal-android.zip \
  final-android-package/ \
  react-native-apk-package/ \
  cordova-apk-package/ \
  pwa-apk-package/ \
  simple-build/ \
  *.sh \
  android-*.md \
  APK-BUILD-METHODS.md \
  -x "*/node_modules/*" "*/build/*" "*/gradle/wrapper/gradle-wrapper.jar"

# Package 3: Assets, data, and documentation
echo "📦 Creating Package 3: Assets and Documentation..."
zip -r zip-packages/jits-journal-assets.zip \
  attached_assets/ \
  data/ \
  app-store-*.md \
  google-play-store-listing.md \
  FINAL-APP-STORE-READINESS.md \
  .config/ \
  working-credentials.md \
  replit.md

# Check file sizes
echo ""
echo "📊 Package sizes:"
ls -lh zip-packages/

echo ""
echo "✅ Zip packages created successfully!"
echo "📁 Files are in the 'zip-packages' directory"
echo ""
echo "📋 Package contents:"
echo "1. jits-journal-core.zip - Main app code (client, server, shared)"
echo "2. jits-journal-android.zip - Android build configurations"
echo "3. jits-journal-assets.zip - Assets, data, and documentation"
