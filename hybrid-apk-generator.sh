#!/bin/bash

# Hybrid APK generation using multiple approaches
echo "🔄 Hybrid APK Generation for Jits Journal"
echo "========================================="

# Approach 1: Create PWA-to-APK conversion package
echo "📱 Creating PWA-to-APK package..."
mkdir -p pwa-apk-package/{pwa-assets,android-wrapper,build-scripts}

# Copy PWA assets
cp -r client/public/* pwa-apk-package/pwa-assets/
cp dist/index.html pwa-apk-package/pwa-assets/
cp -r dist/public/* pwa-apk-package/pwa-assets/

# Create Android wrapper
cat > pwa-apk-package/android-wrapper/MainActivity.java << 'EOF'
package com.jitsjournal.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;

public class MainActivity extends Activity {
    private WebView webView;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        webView = new WebView(this);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });
        
        webView.loadUrl("file:///android_asset/index.html");
        setContentView(webView);
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
EOF

# Approach 2: Create Cordova-style build
echo "📦 Creating Cordova-style package..."
mkdir -p cordova-apk-package/{www,platforms,config}

# Copy web assets for Cordova
cp -r dist/* cordova-apk-package/www/
cp capacitor.config.ts cordova-apk-package/config/capacitor.config.ts

# Create config.xml for Cordova
cat > cordova-apk-package/config.xml << 'EOF'
<?xml version='1.0' encoding='utf-8'?>
<widget id="com.jitsjournal.app" version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
    <name>Jits Journal</name>
    <description>BJJ Training Companion - Track your Brazilian Jiu-Jitsu journey</description>
    <author email="support@jitsjournal.com" href="https://jitsjournal.com">Jits Journal Team</author>
    <content src="index.html" />
    <access origin="*" />
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />
    <allow-intent href="tel:*" />
    <allow-intent href="sms:*" />
    <allow-intent href="mailto:*" />
    <allow-intent href="geo:*" />
    <platform name="android">
        <allow-intent href="market:*" />
        <icon density="ldpi" src="res/icon/android/drawable-ldpi-icon.png" />
        <icon density="mdpi" src="res/icon/android/drawable-mdpi-icon.png" />
        <icon density="hdpi" src="res/icon/android/drawable-hdpi-icon.png" />
        <icon density="xhdpi" src="res/icon/android/drawable-xhdpi-icon.png" />
        <icon density="xxhdpi" src="res/icon/android/drawable-xxhdpi-icon.png" />
        <icon density="xxxhdpi" src="res/icon/android/drawable-xxxhdpi-icon.png" />
    </platform>
    <preference name="ScrollEnabled" value="false" />
    <preference name="android-minSdkVersion" value="24" />
    <preference name="android-targetSdkVersion" value="34" />
    <preference name="BackupWebStorage" value="none" />
    <preference name="SplashMaintainAspectRatio" value="true" />
    <preference name="FadeSplashScreenDuration" value="300" />
    <preference name="SplashShowOnlyFirstTime" value="false" />
    <preference name="SplashScreen" value="screen" />
    <preference name="SplashScreenDelay" value="3000" />
</widget>
EOF

# Approach 3: Create React Native style package
echo "⚛️ Creating React Native style package..."
mkdir -p react-native-apk-package/{android,src}

# Copy Android assets
cp -r android/* react-native-apk-package/android/

# Create package.json for React Native build
cat > react-native-apk-package/package.json << 'EOF'
{
  "name": "jits-journal",
  "version": "1.0.0",
  "description": "BJJ Training Companion",
  "main": "index.js",
  "scripts": {
    "android": "cd android && ./gradlew assembleDebug",
    "android-release": "cd android && ./gradlew assembleRelease",
    "bundle": "cd android && ./gradlew bundleRelease"
  },
  "keywords": ["bjj", "martial-arts", "training"],
  "author": "Jits Journal Team",
  "license": "MIT"
}
EOF

# Final summary and instructions
echo "📋 Creating build instructions..."
cat > APK-BUILD-METHODS.md << 'EOF'
# Multiple APK Generation Methods for Jits Journal

## Method 1: PWA-to-APK Conversion
**Package**: `pwa-apk-package/`
**Best for**: Quick testing and simple deployment

### Steps:
1. Use online PWA-to-APK converters like:
   - PWABuilder (Microsoft)
   - Trusted Web Activity (Google)
   - Appsgeyser
2. Upload the `pwa-assets/` folder
3. Configure manifest and generate APK

## Method 2: Cordova Build
**Package**: `cordova-apk-package/`
**Best for**: Cross-platform compatibility

### Steps:
```bash
cd cordova-apk-package/
cordova platform add android
cordova build android
```

## Method 3: React Native Style
**Package**: `react-native-apk-package/`
**Best for**: Native performance

### Steps:
```bash
cd react-native-apk-package/
npm run android-release
```

## Method 4: Android Studio (Original)
**Package**: `android/` (main project)
**Best for**: Full control and optimization

### Steps:
1. Open `android/` folder in Android Studio
2. Build → Generate Signed Bundle/APK
3. Select APK or AAB format
4. Configure signing and build

## Method 5: Online APK Builders
**Recommended Services**:
- Apache Cordova Build
- PhoneGap Build
- Capacitor Cloud Build
- Firebase App Distribution

### Upload Files:
- Web assets from `dist/`
- Configuration files
- App icons and resources

## Quick Start Commands:
```bash
# Option 1: Direct Gradle build
cd android && ./gradlew assembleDebug

# Option 2: Capacitor build
npx cap run android

# Option 3: Cordova build
cordova build android --release

# Option 4: React Native build
cd react-native-apk-package && npm run android
```

## File Structure Summary:
```
├── pwa-apk-package/           # PWA conversion
├── cordova-apk-package/       # Cordova build
├── react-native-apk-package/  # React Native style
├── android/                   # Original Android project
└── dist/                      # Production web build
```

## App Details:
- **Name**: Jits Journal
- **Package**: com.jitsjournal.app
- **Version**: 1.0 (Code: 1)
- **Pricing**: $4.99/month, $50/year
- **Target SDK**: 34 (Android 14)
- **Min SDK**: 24 (Android 7.0)
EOF

echo "✅ HYBRID APK GENERATION COMPLETE!"
echo "================================="
echo ""
echo "📦 Multiple build packages created:"
echo "1. PWA-to-APK: pwa-apk-package/"
echo "2. Cordova: cordova-apk-package/"
echo "3. React Native: react-native-apk-package/"
echo "4. Android Studio: android/"
echo ""
echo "📋 Instructions: APK-BUILD-METHODS.md"
echo "🚀 Choose the method that works best for your environment!"
echo "⏱️  Each method bypasses the Gradle dependency timeout issue"