
#!/bin/bash

echo "🗂️ Creating zip packages for Jits Journal project..."
echo "=================================================="

# Create a temp directory for organizing files
mkdir -p zip-packages

# Package 1: Core application (client + server + shared)
echo "📦 Creating Package 1: Core Application..."
tar --exclude="*/node_modules/*" --exclude="*/dist/*" --exclude="*/build/*" --exclude="*/.next/*" --exclude="*/coverage/*" \
  -czf zip-packages/jits-journal-core.tar.gz \
  client/ \
  server/ \
  shared/ \
  *.json \
  *.ts \
  *.js \
  *.md \
  .replit 2>/dev/null || echo "Some files not found, continuing..."

# Package 2: Android packages and build files
echo "📦 Creating Package 2: Android Build Packages..."
tar --exclude="*/node_modules/*" --exclude="*/build/*" --exclude="*/gradle/wrapper/gradle-wrapper.jar" \
  -czf zip-packages/jits-journal-android.tar.gz \
  final-android-package/ \
  react-native-apk-package/ \
  cordova-apk-package/ \
  pwa-apk-package/ \
  simple-build/ \
  *.sh \
  android-*.md \
  APK-BUILD-METHODS.md 2>/dev/null || echo "Some files not found, continuing..."

# Package 3: Assets, data, and documentation
echo "📦 Creating Package 3: Assets and Documentation..."
tar -czf zip-packages/jits-journal-assets.tar.gz \
  attached_assets/ \
  data/ \
  app-store-*.md \
  google-play-store-listing.md \
  FINAL-APP-STORE-READINESS.md \
  .config/ \
  working-credentials.md \
  replit.md 2>/dev/null || echo "Some files not found, continuing..."

# Check file sizes
echo ""
echo "📊 Package sizes:"
ls -lh zip-packages/

echo ""
echo "✅ Zip packages created successfully!"
echo "📁 Files are in the 'zip-packages' directory"
echo ""
echo "📋 Package contents:"
echo "1. jits-journal-core.tar.gz - Main app code (client, server, shared)"
echo "2. jits-journal-android.tar.gz - Android build configurations"
echo "3. jits-journal-assets.tar.gz - Assets, data, and documentation"
