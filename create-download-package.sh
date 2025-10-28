
#!/bin/bash

echo "📦 Creating Complete Jits Journal Download Package..."
echo "===================================================="

# Create timestamp for unique filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="jits-journal-complete-${TIMESTAMP}"

# Create a temporary directory for the package
mkdir -p "/tmp/${PACKAGE_NAME}"

echo "📂 Copying application files..."

# Copy main application directories
cp -r client "/tmp/${PACKAGE_NAME}/" 2>/dev/null || echo "Skipped client"
cp -r server "/tmp/${PACKAGE_NAME}/" 2>/dev/null || echo "Skipped server"
cp -r shared "/tmp/${PACKAGE_NAME}/" 2>/dev/null || echo "Skipped shared"

# Copy configuration files
cp package*.json "/tmp/${PACKAGE_NAME}/" 2>/dev/null
cp tsconfig.json "/tmp/${PACKAGE_NAME}/" 2>/dev/null
cp vite.config.ts "/tmp/${PACKAGE_NAME}/" 2>/dev/null
cp tailwind.config.ts "/tmp/${PACKAGE_NAME}/" 2>/dev/null
cp postcss.config.js "/tmp/${PACKAGE_NAME}/" 2>/dev/null
cp drizzle.config.ts "/tmp/${PACKAGE_NAME}/" 2>/dev/null
cp capacitor.config.ts "/tmp/${PACKAGE_NAME}/" 2>/dev/null
cp components.json "/tmp/${PACKAGE_NAME}/" 2>/dev/null
cp .gitignore "/tmp/${PACKAGE_NAME}/" 2>/dev/null
cp .replit "/tmp/${PACKAGE_NAME}/" 2>/dev/null

# Copy documentation
cp *.md "/tmp/${PACKAGE_NAME}/" 2>/dev/null
cp working-credentials.md "/tmp/${PACKAGE_NAME}/" 2>/dev/null

# Copy Android packages
cp -r final-android-package "/tmp/${PACKAGE_NAME}/" 2>/dev/null
cp -r pwa-apk-package "/tmp/${PACKAGE_NAME}/" 2>/dev/null
cp -r react-native-apk-package "/tmp/${PACKAGE_NAME}/" 2>/dev/null
cp -r cordova-apk-package "/tmp/${PACKAGE_NAME}/" 2>/dev/null
cp -r simple-build "/tmp/${PACKAGE_NAME}/" 2>/dev/null

# Copy build scripts
cp *.sh "/tmp/${PACKAGE_NAME}/" 2>/dev/null

# Copy data and assets
cp -r data "/tmp/${PACKAGE_NAME}/" 2>/dev/null
cp -r attached_assets "/tmp/${PACKAGE_NAME}/" 2>/dev/null

# Create README for the package
cat > "/tmp/${PACKAGE_NAME}/DOWNLOAD-README.md" << 'EOF'
# Jits Journal - Complete Application Package

## 📦 Package Contents

This package contains the complete Jits Journal application including:

- ✅ **Client application** (React/TypeScript PWA)
- ✅ **Server application** (Express/Node.js API)
- ✅ **Shared schemas** (Database models)
- ✅ **Android build packages** (Multiple build methods)
- ✅ **Documentation** (Setup guides, store listings)
- ✅ **Build scripts** (Automated build tools)
- ✅ **App store assets** (Icons, screenshots, graphics)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git (optional)

### Setup Instructions

1. **Extract this package** to your desired location

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the app:**
   - Open http://localhost:5000 in your browser
   - Default credentials: bjjjitsjournal@gmail.com

## 📱 Building for Android

See `APK-BUILD-METHODS.md` for detailed instructions on building Android APKs.

### Quick build options:
- **Method 1:** Use `hybrid-apk-generator.sh` for automated builds
- **Method 2:** Use Android Studio with `final-android-package/`
- **Method 3:** Deploy to Replit and wrap with Median.co

## 📄 Important Files

- `package.json` - Dependencies and scripts
- `FINAL-APP-STORE-READINESS.md` - App store submission guide
- `google-play-store-listing.md` - Play Store listing content
- `working-credentials.md` - Login credentials and API keys

## 🔧 Configuration

The app uses:
- PostgreSQL database (auto-configured on Replit)
- RevenueCat for subscriptions
- Vite for development and building
- Express for backend API

## 📚 Documentation

- `app-store-launch-guide.md` - Complete launch guide
- `android-release-guide.md` - Android release process
- `replit.md` - Replit-specific instructions

## 🆘 Support

For issues or questions:
- Check the documentation files included
- Review `FINAL-APP-STORE-READINESS.md` for common issues
- All credentials are in `working-credentials.md`

---

**Built with ❤️ for the BJJ community**
EOF

# Create the zip file in the current directory
echo "🗜️ Creating zip archive..."
cd /tmp
zip -r "${PACKAGE_NAME}.zip" "${PACKAGE_NAME}" -q

# Move to current directory
mv "${PACKAGE_NAME}.zip" "$OLDPWD/"

# Cleanup
rm -rf "/tmp/${PACKAGE_NAME}"

echo ""
echo "✅ PACKAGE CREATED SUCCESSFULLY!"
echo "================================"
echo ""
echo "📦 Package: ${PACKAGE_NAME}.zip"
echo "📍 Location: $(pwd)/${PACKAGE_NAME}.zip"
echo "📊 Size: $(du -h "${PACKAGE_NAME}.zip" | cut -f1)"
echo ""
echo "🎉 Your complete Jits Journal app is ready to download!"
echo ""
echo "To download:"
echo "1. Look for the file in your Replit file tree"
echo "2. Right-click '${PACKAGE_NAME}.zip'"
echo "3. Select 'Download'"
echo ""
