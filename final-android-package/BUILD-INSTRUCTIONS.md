# APK Build Instructions for Jits Journal

## Method 1: Android Studio (Recommended)
1. Open Android Studio
2. Open the `android-studio/` folder as a project
3. Let Gradle sync complete
4. Go to Build → Generate Signed Bundle/APK
5. Choose APK or AAB format
6. Create keystore if needed
7. Build and test

## Method 2: Command Line
```bash
cd android-studio/
./gradlew assembleDebug      # For debug APK
./gradlew assembleRelease    # For release APK
./gradlew bundleRelease      # For AAB (Google Play)
```

## Method 3: Online APK Builder
1. Use services like PhoneGap Build or Apache Cordova
2. Upload the web-assets/ folder
3. Use the provided manifest and config files
4. Generate APK online

## Files Included:
- android-studio/: Complete Android project
- web-assets/: Production web build
- store-assets/: Screenshots and graphics
- capacitor.config.ts: Capacitor configuration
- BUILD-INSTRUCTIONS.md: This file
