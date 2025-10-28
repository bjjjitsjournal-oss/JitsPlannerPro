# Google Play Store Upload Guide - Jits Journal

## 📋 What You Need

### 1. App Icon (512x512 px)
✅ **Location**: `play-store-assets/app-icon-original.png`
- Format: 32-bit PNG with alpha transparency
- Size: 512 x 512 pixels
- Max file size: 1024 KB

### 2. Screenshots (Minimum 2, Maximum 8)
📱 **Required**: Phone screenshots at **1080 x 1920 px** (portrait)
- Format: JPEG or 24-bit PNG (no alpha)
- Max file size: 8 MB each
- Minimum: 2 screenshots
- Recommended: 4-8 screenshots showing key features

### 3. Feature Graphic (Optional but Recommended)
✅ **Location**: `play-store-assets/feature-graphic.png`
🎨 **Dimensions**: 1024 x 500 px
- Format: JPEG or 24-bit PNG

---

## 📸 How to Take Screenshots

### **Option 1: From Your Android Device** (RECOMMENDED)

1. Install your APK/AAB on your Android phone
2. Open Jits Journal app
3. Navigate to each key screen
4. Take screenshots (Power + Volume Down)
5. Screenshots will be in your Photos/Gallery

**Best screens to capture**:
1. Dashboard (with sample data)
2. Log Class screen
3. Notes page (with a sample note)
4. Belt tracking page
5. Video search page
6. Competition game plan
7. Settings page
8. Social/Gym page

### **Option 2: Using Android Studio Emulator**

1. Open Android Studio
2. Create a phone emulator (Pixel 5 or similar)
3. Set resolution to 1080 x 1920
4. Run your APK on the emulator
5. Use the camera icon in emulator toolbar to take screenshots

### **Option 3: Using Chrome DevTools** (Quick but not ideal)

1. Open https://bjj-jits-journal.onrender.com in Chrome
2. Press F12 (Developer Tools)
3. Click device toolbar icon (phone/tablet icon)
4. Set dimensions to: **1080 x 1920**
5. Navigate through your app
6. Right-click → "Capture screenshot" for each page

**Note**: This won't show Android UI elements, but works for quick screenshots.

---

## 📤 How to Upload to Google Play Console

### Step 1: Log into Google Play Console
1. Go to https://play.google.com/console
2. Select **Jits Journal** app

### Step 2: Upload App Icon
1. Click **Main store listing** (left sidebar)
2. Scroll to **App icon** section
3. Click **Upload** → Select `app-icon-original.png`
4. Click **Save**

### Step 3: Upload Screenshots
1. Still in **Main store listing**
2. Scroll to **Screenshots** section
3. Under **Phone screenshots**:
   - Click **Add screenshots**
   - Select your 1080 x 1920 screenshots (2-8 images)
   - Drag to reorder (first screenshot shows in store listing)
4. Click **Save**

### Step 4: Upload New AAB (Version 33)
1. Click **Production** (left sidebar)
2. Click **Create new release**
3. Click **Upload** → Select your `app-release.aab` file
4. Fill in **Release name**: Version 33
5. Fill in **Release notes**:
   ```
   - Fixed UI display issues
   - Improved account deletion feature
   - Enhanced dark mode support
   - Bug fixes and performance improvements
   ```
6. Click **Next** → **Save** → **Review release**
7. Click **Start rollout to Production**

---

## ✅ Checklist Before Submission

- [ ] App icon uploaded (512x512 px)
- [ ] At least 2 phone screenshots uploaded (1080x1920 px)
- [ ] Feature graphic uploaded (optional)
- [ ] App description is complete
- [ ] Content rating completed
- [ ] Privacy policy URL added
- [ ] AAB file uploaded (version 33)
- [ ] Release notes filled in
- [ ] All required store listing info complete

---

## 📁 Files Location

All files for upload are in: `C:\Projects\JitsPlannerPro\play-store-assets\`

- **App Icon**: `app-icon-original.png` ✅
- **Feature Graphic**: `feature-graphic.png` ✅
- **Screenshots**: (You need to take these yourself - see guide above)
- **AAB File**: `C:\Projects\JitsPlannerPro\android\app\build\outputs\bundle\release\app-release.aab`

---

## 🎯 Quick Tips

1. **First screenshot is most important** - Make it show your app's main value
2. **Show real data** - Avoid empty states in screenshots
3. **Highlight key features** - Each screenshot should show a different feature
4. **Keep text readable** - Make sure button text and UI is clear
5. **Use consistent data** - Same user/profile across all screenshots

---

## ⏱️ Timeline

- **Review time**: Usually 1-3 days
- **After approval**: Live on Google Play Store immediately
- **Updates**: New versions typically reviewed in 1-2 days

---

Good luck with your submission! 🚀
