# Codemagic Setup Guide - iOS Build Without a Mac
## Jits Journal v1.0.43

---

## 🎯 Overview

**Codemagic** is a cloud CI/CD platform that builds iOS apps **without needing a Mac**. It provides macOS build machines in the cloud that handle everything automatically.

**What you'll get:**
- ✅ Automated iOS builds
- ✅ TestFlight uploads
- ✅ App Store submissions
- ✅ Android builds (bonus!)
- ✅ 500 free build minutes/month

---

## 📋 Prerequisites

Before starting, you need:

1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com/programs/enroll/

2. **GitHub Repository**
   - Your code must be on GitHub, GitLab, or Bitbucket
   - This guide assumes GitHub

3. **Email Address**
   - For Codemagic account creation

---

## 🚀 Step 1: Create Codemagic Account

1. Go to https://codemagic.io/signup
2. Click **"Sign up with GitHub"**
3. Authorize Codemagic to access your repositories
4. Select the **free plan** to start (500 minutes/month)

---

## 🔗 Step 2: Add Your Repository

1. In Codemagic dashboard, click **"Add application"**
2. Select **GitHub** as your source
3. Find and select your **jitsjournal** repository
4. Click **"Finish: Add application"**

---

## 🍎 Step 3: Get Apple Developer Certificates (NO MAC NEEDED!)

Codemagic can generate certificates for you automatically! Here's how:

### Option A: Automatic Code Signing (Recommended)

1. In Codemagic, go to your app → **Settings** → **iOS code signing**
2. Click **"Automatic code signing"**
3. Click **"Enable automatic code signing"**
4. You'll be prompted to log in with your **Apple ID**
5. Enter your Apple Developer credentials
6. Codemagic will automatically:
   - Create signing certificates
   - Generate provisioning profiles
   - Manage everything for you!

**Benefits:**
- ✅ No Mac required
- ✅ Automatic certificate renewal
- ✅ Zero configuration

### Option B: Manual Code Signing (If you have certificates)

If you already have a `.p12` certificate and `.mobileprovision` file:

1. Go to **Settings** → **iOS code signing** → **Manual**
2. Upload your certificate (`.p12` file)
3. Enter certificate password
4. Upload provisioning profile (`.mobileprovision` file)
5. Give it a reference name (e.g., `jits_journal_cert`)

---

## 🔑 Step 4: Create App Store Connect API Key

This allows Codemagic to upload builds to TestFlight/App Store.

### 4.1 Generate API Key

1. Log into [App Store Connect](https://appstoreconnect.apple.com)
2. Go to **Users and Access** → **Integrations** → **App Store Connect API**
3. Click **+ (Generate API Key)**
4. **Name:** Codemagic
5. **Access:** App Manager
6. Click **Generate**
7. **Download** the `.p8` file (you can only download it once!)
8. **Copy and save:**
   - Issuer ID (looks like: `12345678-1234-1234-1234-123456789012`)
   - Key ID (looks like: `ABCDEFGHIJ`)
   - API Key content (open `.p8` file in text editor and copy all text)

### 4.2 Add API Key to Codemagic

1. In Codemagic, go to **Teams** → **Integrations**
2. Click **App Store Connect**
3. Click **Add key**
4. Fill in:
   - **Issuer ID:** (paste from step above)
   - **Key ID:** (paste from step above)
   - **API key:** (paste entire content of `.p8` file)
   - **Key name:** `jits_journal_asc`
5. Click **Save**

---

## 🔐 Step 5: Configure Environment Variables

### 5.1 Create App Store Credentials Group

1. Go to **Teams** → **Environment variables**
2. Click **+ Add variable group**
3. Name: `app_store_credentials`
4. Add these variables:

| Variable Name | Value | How to Get It |
|--------------|-------|---------------|
| `APP_STORE_CONNECT_PRIVATE_KEY` | (content of .p8 file) | From Step 4.1 |
| `APP_STORE_CONNECT_KEY_IDENTIFIER` | Your Key ID | From Step 4.1 |
| `APP_STORE_CONNECT_ISSUER_ID` | Your Issuer ID | From Step 4.1 |

5. Mark all as **Secure** (checkbox)
6. Click **Add**

---

## 📱 Step 6: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+ (New App)**
3. Fill in:
   - **Platform:** iOS
   - **Name:** Jits Journal
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** Select **com.jitsjournal.app**
     - If not available, you need to register it in [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list) first
   - **SKU:** jitsjournal-ios (any unique identifier)
   - **User Access:** Full Access
4. Click **Create**
5. **Copy the App Store ID:**
   - In App Store Connect, go to your app → **App Information**
   - Scroll down to **General Information**
   - Copy the **Apple ID** (10-digit number like `1234567890`)

---

## ⚙️ Step 7: Update Codemagic Configuration

1. Open your repository's `codemagic.yaml` file
2. Update the following:

```yaml
environment:
  vars:
    # APP_STORE_APP_ID: 1234567890  # Replace with your App Store ID from Step 6

publishing:
  email:
    recipients:
      - your-email@example.com  # Replace with your actual email
```

3. Commit and push to GitHub:

```bash
git add codemagic.yaml
git commit -m "Configure Codemagic for iOS builds"
git push origin main
```

---

## 🏗️ Step 8: Run Your First Build!

### 8.1 Start a Build

1. In Codemagic dashboard, go to your app
2. Click **Start new build**
3. Select **ios-release** workflow
4. Select branch: **main**
5. Click **Start new build**

### 8.2 Watch the Build

You'll see 7 steps execute:
1. 📦 Install npm dependencies (~2-3 min)
2. 🏗️ Build web application (~1-2 min)
3. 🔄 Sync Capacitor iOS (~30 sec)
4. 📱 Install CocoaPods (~1 min)
5. ✍️ Set up code signing (~30 sec)
6. 🔢 Increment build number (~10 sec)
7. 🎨 Build IPA (~3-5 min)

**Total time:** ~8-12 minutes

### 8.3 Download the IPA

After successful build:
1. Click on the completed build
2. Go to **Artifacts** tab
3. Download the `.ipa` file
4. Or it will automatically upload to TestFlight!

---

## 📲 Step 9: TestFlight Distribution

If everything is configured correctly, Codemagic will automatically:

1. ✅ Build the IPA
2. ✅ Upload to App Store Connect
3. ✅ Submit to TestFlight
4. ✅ Add to "Internal Testers" group

### Add Testers

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → **TestFlight** tab
3. Click **Internal Testing** → **Internal Testers**
4. Click **+** to add testers (by email)
5. Testers receive email with TestFlight invite
6. They install TestFlight app → Accept invite → Install app

---

## 🤖 Bonus: Android Builds Too!

The `codemagic.yaml` also includes Android workflow! But you'll need:

### Android Setup

1. **Generate upload keystore** (if you don't have one):
   ```bash
   keytool -genkey -v -keystore jitsjournal-upload.keystore \
     -alias jitsjournal -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Upload keystore to Codemagic:**
   - Go to **Code signing identities** → **Android**
   - Upload `jitsjournal-upload.keystore`
   - Enter keystore password, key alias, and key password
   - Reference name: `jits_journal_keystore`

3. **Get Google Play service account:**
   - Follow: https://docs.codemagic.io/yaml-publishing/google-play/
   - Upload JSON to Codemagic

4. **Push to trigger build:**
   ```bash
   git push origin main
   ```

---

## 🔄 Automatic Builds

Codemagic will automatically build when you:

- ✅ Push to `main` branch
- ✅ Create a tag (e.g., `v1.0.43`)
- ✅ Push to `release/*` branches

To disable automatic builds:
- Go to app **Settings** → **Build triggers**
- Configure as needed

---

## 💰 Pricing

### Free Tier
- ✅ 500 build minutes/month
- ✅ macOS M2 machines
- ✅ Unlimited team members
- ✅ All features included

### Paid Plans (if needed)
- **Pay-as-you-go:** $0.038/min (~$4 per build)
- **Unlimited:** $199/month for unlimited builds

**Estimate:** With 500 free minutes, you can do ~40-50 iOS builds/month

---

## 🛠️ Troubleshooting

### Build Fails: "No signing certificate found"

**Solution:**
- Go to **Settings** → **iOS code signing**
- Make sure automatic signing is enabled
- Or manually upload certificate

### Build Fails: "Invalid bundle identifier"

**Solution:**
1. Verify Bundle ID in Apple Developer Portal
2. Check `codemagic.yaml` has correct `bundle_identifier`
3. Ensure certificate matches bundle ID

### Build Succeeds but TestFlight Upload Fails

**Solution:**
- Check App Store Connect API key is correct
- Verify app exists in App Store Connect
- Make sure `APP_STORE_APP_ID` is set in YAML

### CocoaPods Installation Fails

**Solution:**
Add this to your script:
```yaml
- name: Install CocoaPods dependencies
  script: |
    cd ios/App
    pod repo update
    pod install
```

---

## 📊 Build Status Badge (Optional)

Add build status to your README:

```markdown
[![Codemagic build status](https://api.codemagic.io/apps/<APP_ID>/status_badge.svg)](https://codemagic.io/apps/<APP_ID>/latest_build)
```

Get your `<APP_ID>` from Codemagic app settings.

---

## 🔍 Useful Links

- **Codemagic Docs:** https://docs.codemagic.io/
- **Capacitor Guide:** https://docs.codemagic.io/yaml-quick-start/building-an-ionic-app/
- **iOS Code Signing:** https://docs.codemagic.io/code-signing-yaml/signing-ios/
- **Publishing to App Store:** https://docs.codemagic.io/yaml-publishing/app-store-connect/
- **Sample Projects:** https://github.com/codemagic-ci-cd/codemagic-sample-projects

---

## ✅ Checklist

Before running your first build:

- [ ] Codemagic account created
- [ ] Repository connected
- [ ] Apple Developer account active
- [ ] iOS code signing configured (automatic or manual)
- [ ] App Store Connect API key added
- [ ] App created in App Store Connect
- [ ] App Store ID added to `codemagic.yaml`
- [ ] Email updated in `codemagic.yaml`
- [ ] Changes committed and pushed

---

## 🎉 Next Steps

After successful iOS build:

1. **Test on TestFlight** - Invite team to test
2. **Fix any bugs** - Based on tester feedback
3. **Add screenshots** - Create App Store screenshots
4. **Write description** - Prepare App Store listing
5. **Submit for review** - Change `submit_to_app_store: true`
6. **Launch!** - Your app goes live 🚀

---

**You're all set to build iOS apps without a Mac!** 🎊
