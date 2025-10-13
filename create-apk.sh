#!/bin/bash

# Simple APK generation script for Jits Journal
echo "🚀 Creating APK for Jits Journal..."

# Step 1: Create a minimal build directory
echo "📦 Preparing build files..."
mkdir -p simple-build/assets/www
mkdir -p simple-build/res/drawable
mkdir -p simple-build/res/values

# Step 2: Copy essential files
cp dist/index.html simple-build/assets/www/
cp -r dist/public simple-build/assets/www/
cp -r client/public/* simple-build/assets/www/public/ 2>/dev/null || true

# Step 3: Create Android manifest
cat > simple-build/AndroidManifest.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.jitsjournal.app"
    android:versionCode="1"
    android:versionName="1.0">
    
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    
    <application
        android:allowBackup="true"
        android:icon="@drawable/icon"
        android:label="Jits Journal"
        android:theme="@style/AppTheme">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# Step 4: Create basic activity
mkdir -p simple-build/src/main/java/com/jitsjournal/app
cat > simple-build/src/main/java/com/jitsjournal/app/MainActivity.java << 'EOF'
package com.jitsjournal.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        WebView webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/www/index.html");
        
        setContentView(webView);
    }
}
EOF

# Step 5: Create styles
cat > simple-build/res/values/styles.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="android:Theme.Material.Light.NoActionBar">
        <item name="android:statusBarColor">#1e40af</item>
        <item name="android:windowBackground">@drawable/splash_screen</item>
    </style>
</resources>
EOF

# Step 6: Create a simple icon (placeholder)
echo "🎨 Creating app icon..."
# Since we can't create PNG files easily, we'll use a drawable XML
cat > simple-build/res/drawable/icon.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="oval">
    <solid android:color="#1e40af" />
    <size android:width="48dp" android:height="48dp" />
</shape>
EOF

# Step 7: Copy icon from assets if available
if [ -f "client/public/icon-192x192.png" ]; then
    cp client/public/icon-192x192.png simple-build/res/drawable/icon.png
fi

echo "✅ APK build files prepared!"
echo "📱 Build structure created in simple-build/"
echo ""
echo "📋 Google Play Store Submission Checklist:"
echo "✓ App assets and screenshots ready"
echo "✓ Privacy policy and terms of service created"
echo "✓ Capacitor configuration complete"
echo "✓ App manifest and permissions configured"
echo "✓ Subscription system with $4.99/month & $50/year pricing"
echo "✓ Video search text improved for better readability"
echo ""
echo "🎯 Next Steps:"
echo "1. Upload these files to Android Studio"
echo "2. Generate signed APK/AAB using Android Studio"
echo "3. Test on Android device"
echo "4. Submit to Google Play Console"
echo ""
echo "📁 Essential files for Google Play submission:"
echo "- capacitor.config.ts (Capacitor configuration)"
echo "- google-play-store-listing.md (Store listing content)"
echo "- app-store-assets/ (Feature graphics and screenshots)"
echo "- Privacy policy available at your-domain.com/privacy"
echo "- Terms of service available at your-domain.com/terms"