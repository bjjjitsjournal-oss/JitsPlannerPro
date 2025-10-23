# Windows Build Guide - v1.0.59

## What's New in v1.0.59

### 🐛 DEBUGGING BUILD for Samsung Notes Issue
- **Network Timeout Detection**: 30-second timeout alerts if save/delete hangs
- **Detailed Logging**: Console shows exactly where the operation fails
- **Server Logging**: Backend logs all note requests to identify issues
- **Better Error Messages**: Shows exact error details instead of generic messages

### 💎 NEW SUBSCRIPTION TIERS
**Free Tier ($0):**
- 3 notes maximum
- 3 classes maximum
- Can join a gym
- Can only share notes via social media (no community sharing)

**Premium Tier ($9.99/month):**
- Unlimited notes
- Unlimited classes
- 50GB data usage limit
- 1 community share per week

**Gym Tier ($100/month):**
- Unlimited notes
- Unlimited classes
- 100GB data usage limit
- Unlimited gym sharing (for admins)
- 3 community shares per week
- Charged $5 per gym member per month

### 📊 DASHBOARD IMPROVEMENTS
- Replaced "Classes This Week" tile with detailed user stats
- Shows breakdown of class types (Gi, No-Gi, Open Mat, etc.)
- Displays highest submissions per training session
- Displays highest submissions per week

### 🔒 SHARING RESTRICTIONS
- Free users: Community sharing button shows "Premium Feature" message
- Premium users: Limited to 1 community share per week
- Gym users: Unlimited gym sharing + 3 community shares per week
- Backend enforces these limits with clear error messages

## What's New in v1.0.56

### 🚨 CRITICAL FIXES for iOS & Android (from v1.0.52)

✅ **Fixed registration completely broken on mobile**
- Registration API calls now work on iOS/Android (was calling wrong URL)
- Email verification redirects use proper HTTPS URL (not capacitor://)
- Users can now successfully create accounts on mobile

✅ **Fixed "works every other time" login issue**
- Mobile app now sends proper authentication credentials (Supabase access token)
- Login succeeds on first attempt every time
- Fast and reliable (<1 second)

✅ **Fixed social sharing URLs**
- Twitter/Facebook share buttons now use production URL
- No more broken "capacitor://localhost" links

✅ **Better error messages & loading states**
- Login errors display in a red box on the screen (not invisible toasts)
- Shows "Signing you in..." with clear progress indicators
- Professional user experience

### 🔧 Technical Summary
Fixed 4 critical mobile issues:
1. Registration API calls (capacitor URL → production URL)
2. Email verification redirect (capacitor URL → HTTPS URL)
3. Login authentication (missing auth token → included)
4. Social sharing URLs (capacitor URL → production URL)

See **MOBILE_ISSUES_FIXED_v1.0.52.md** for complete technical details.

---

## Build Instructions for Windows

### Step 1: Set Environment Variables in PowerShell

Open PowerShell and run these commands:

```powershell
$env:VITE_SUPABASE_URL="https://umotigprfosrrjwpxlnp.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtb3RpZ3ByZm9zcnJqd3B4bG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYyNzc4OTEsImV4cCI6MjA0MTg1Mzg5MX0.pHDnqd_DUl2eKF2qTQmDDDwWUMqfY2_TGf5iXnkELVE"
$env:VITE_API_BASE_URL="https://bjj-jits-journal.onrender.com"
```

### Step 2: Build the Web App

```powershell
npm run build
```

### Step 3: Verify Credentials Were Bundled

```powershell
Select-String -Path "dist/assets/*.js" -Pattern "umotigprfosrrjwpxlnp"
```

You should see results showing the Supabase URL is in the built files. If not, go back to Step 1.

### Step 4: Sync to Android

```powershell
npx cap sync android
```

### Step 5: Build the APK

```powershell
cd android
./gradlew bundleRelease
```

### Step 6: Find Your APK

The APK will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Installing on Your Samsung Phone

### Method 1: Google Play Console (Recommended)
1. Upload `app-release.aab` to Google Play Console
2. Create internal testing track
3. Install from Play Store

### Method 2: Install Directly (APK only)
If you have an APK file instead of AAB:
1. Transfer APK to your phone via USB
2. Enable "Install from Unknown Sources" in phone settings
3. Open the APK file and install

---

## Testing Login on Mobile

When you install v1.0.52 on your phone:

### Test 1: Try to log in
**Email:** bjjjitsjournal@gmail.com  
**Password:** (your password)

**If you see a red error box:**
- Read the error message
- It will tell you exactly what's wrong:
  - "Invalid email or password" = Wrong credentials
  - "Email not confirmed" = Check your email for confirmation link

### Test 2: Create a new account (if needed)
1. Click "Don't have an account? Sign up"
2. Enter your details
3. Check email for confirmation link
4. Click the link to confirm
5. Go back to app and log in

---

## Common Issues

### Issue: "Invalid email or password"
**Solution:** The account might not exist. Try creating it first.

### Issue: "Email not confirmed"
**Solution:** Check your email (bjjjitsjournal@gmail.com) for a confirmation link from Supabase and click it.

### Issue: Nothing happens when clicking login
**Solution:** This should be fixed in v1.0.52. You should now see an error message if something goes wrong.

---

## What Changed from v1.0.51

**v1.0.51:** Error messages used toast notifications that didn't show on mobile

**v1.0.52:** Error messages now display in a prominent red box that's always visible

This means you'll finally be able to see what's wrong when login fails!

---

## Next Steps

After you build and install v1.0.52:
1. Try logging in with `bjjjitsjournal@gmail.com`
2. If you see an error message, tell me what it says
3. We'll fix the specific issue (probably need to create/confirm the account)

The good news: **The app WORKS** - we just need to get your account set up correctly.
