# Codemagic Quick Start - iOS Build for v1.0.44

## 🎯 What You Need
- ✅ Apple Developer Account ($99/year) - [Sign up here](https://developer.apple.com/programs/enroll/)
- ✅ Your GitHub repo (you have this!)
- ✅ 15 minutes of your time

---

## 📋 Step-by-Step Checklist

### ✅ Step 1: Create Codemagic Account (2 minutes)
1. Go to: https://codemagic.io/signup
2. Click **"Sign up with GitHub"**
3. Authorize Codemagic to access your repos
4. Select **Free plan** (500 build minutes/month)

---

### ✅ Step 2: Connect Your Repository (1 minute)
1. In Codemagic dashboard → Click **"Add application"**
2. Select **GitHub**
3. Find your **jitsjournal** repo
4. Click **"Finish: Add application"**

---

### ✅ Step 3: Set Up iOS Code Signing (3 minutes)

**Codemagic can do this automatically - no Mac needed!**

1. Go to your app → **Settings** → **iOS code signing**
2. Click **"Automatic code signing"**
3. Click **"Enable automatic code signing"**
4. Log in with your **Apple Developer ID** (same as App Store Connect)
5. Codemagic will automatically create all certificates ✨

**That's it!** No manual certificates needed.

---

### ✅ Step 4: Create App Store Connect API Key (5 minutes)

This lets Codemagic upload your app to the App Store.

#### 4a) Generate the API Key
1. Go to: https://appstoreconnect.apple.com
2. Click **Users and Access** → **Integrations** → **App Store Connect API**
3. Click **"+"** to generate a new key
4. **Name:** Codemagic
5. **Access:** App Manager
6. Click **Generate**
7. **Download the .p8 file** (you can only do this once!)

#### 4b) Copy These 3 Things (write them down!)
- **Issuer ID** (looks like: `12345678-1234-1234-1234-123456789012`)
- **Key ID** (looks like: `ABCDEFGHIJ`)
- **API Key content** (open the .p8 file in Notepad and copy everything)

#### 4c) Add to Codemagic
1. In Codemagic → **Teams** → **Integrations** → **App Store Connect**
2. Click **"Add key"**
3. Paste:
   - Issuer ID
   - Key ID  
   - API key (full content from .p8 file)
4. **Key name:** `jits_journal`
5. Click **Save**

---

### ✅ Step 5: Create Your App in App Store Connect (3 minutes)

1. Go to: https://appstoreconnect.apple.com
2. Click **My Apps** → **"+"** → **New App**
3. Fill in:
   - **Platform:** iOS
   - **Name:** Jits Journal
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** `com.jitsjournal.app`
     - ⚠️ If not in dropdown, you need to register it first at [developer.apple.com/account](https://developer.apple.com/account/resources/identifiers/list)
   - **SKU:** jitsjournal (any unique text)
   - **User Access:** Full Access
4. Click **Create**

#### 5b) Get Your App ID
1. In App Store Connect → Your app → **App Information**
2. Scroll to **General Information**
3. Copy the **Apple ID** (10-digit number like `6738366473`)
4. **Save this number** - you'll need it next!

---

### ✅ Step 6: Configure Codemagic Build Settings (2 minutes)

1. In Codemagic dashboard → Your app → Click **"Start your first build"**
2. Click **"Set up build configuration"**
3. Select **"Capacitor App"** template
4. Click **iOS** tab
5. Fill in:
   - **Xcode project or workspace:** `ios/App/App.xcworkspace`
   - **Xcode scheme:** `App`
   - **Bundle identifier:** `com.jitsjournal.app`
   - **App Store Connect API key:** Select the one you added
   - **App Store ID:** (paste your 10-digit number from Step 5b)
6. Click **"Save"**

---

### ✅ Step 7: Start Your First Build! (10 minutes build time)

1. In Codemagic → Your app → Click **"Start new build"**
2. Select **branch:** `main`
3. Click **"Start new build"**

**What happens:**
- 📦 Installs dependencies (~2 min)
- 🏗️ Builds your React app (~2 min)
- 🔄 Syncs Capacitor (~30 sec)
- 📱 Installs iOS pods (~1 min)
- ✍️ Signs the app (~30 sec)
- 🎨 Builds the IPA file (~4 min)
- 📲 Uploads to TestFlight (~1 min)

**Total:** ~10 minutes

---

## 🎉 Success!

If everything worked, you'll see:
- ✅ Build completed successfully
- ✅ App uploaded to App Store Connect
- ✅ Available in TestFlight

### Test It:
1. Open TestFlight app on your iPhone
2. Check your email for TestFlight invite
3. Accept invite and install Jits Journal v1.0.44
4. Test the new expandable classes feature!

---

## 🚀 Submit to App Store (When Ready)

1. In App Store Connect → Your app
2. Add:
   - Screenshots (required)
   - App description
   - Keywords
   - Privacy policy URL
3. Click **"Submit for Review"**
4. Usually approved in 24-48 hours

---

## 💰 Codemagic Pricing

**Free Tier:**
- ✅ 500 minutes/month (enough for ~40-50 builds)
- ✅ Full features
- ✅ Unlimited apps

**If you run out:**
- $0.038/minute (~$4 per iOS build)
- Or unlimited plan: $199/month

---

## ❓ Troubleshooting

**Build fails at code signing?**
→ Make sure automatic code signing is enabled in Settings → iOS code signing

**Bundle ID not found?**
→ Register it at [developer.apple.com/account](https://developer.apple.com/account/resources/identifiers/list/bundleId)

**TestFlight upload fails?**
→ Double-check your App Store Connect API key and App ID

**Need help?**
→ Full detailed guide: `CODEMAGIC_SETUP_GUIDE.md`

---

## 📧 Need Help?

Stuck on any step? Let me know which step number and I'll walk you through it!

**Codemagic Support:** https://codemagic.io/support/
**Docs:** https://docs.codemagic.io/

---

**You're building iOS apps without a Mac! 🎊**
