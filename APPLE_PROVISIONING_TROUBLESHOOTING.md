# Apple Provisioning Profile Troubleshooting Guide

## Error: "No matching profiles found for bundle identifier 'com.jitsjournal.app'"

This error occurs when Codemagic cannot find or create a provisioning profile for your app.

## Root Causes & Solutions

### Issue 1: Bundle ID Not Registered ⚠️

**Check:**
1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles** → **Identifiers**
3. Look for `com.jitsjournal.app` in the list

**If NOT found:**
1. Click the **+** button
2. Select **App IDs** → Continue
3. Select **App** → Continue
4. Fill in:
   - Description: `Jits Journal`
   - Bundle ID: Select "Explicit" and enter exactly: `com.jitsjournal.app`
5. Click **Register**

### Issue 2: API Key Lacks Permissions ⚠️

**Check:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **Users and Access** → **Keys** tab
3. Find your API key (ID: `9WMGAH2S8G`)
4. Check the **Access** column

**Required:** Must show **"App Manager"** or **"Admin"**
**Won't work:** "Developer" or "Read-only"

**If wrong permissions:**
1. You cannot edit an existing key's role
2. You must **delete the key** and create a new one:
   - In App Store Connect: Users and Access → Keys → Delete old key
   - Create new key with **App Manager** role
   - Download the new `.p8` file
   - In Codemagic: Delete old integration and create new one with new key

### Issue 3: App Not Created in App Store Connect ⚠️

**Check:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps**
3. Look for "Jits Journal" in the list

**If NOT found:**
1. Click the **+** button → **New App**
2. Fill in:
   - Platform: iOS
   - Name: Jits Journal
   - Primary Language: English
   - Bundle ID: Select `com.jitsjournal.app` from dropdown (only appears if registered)
   - SKU: `jitsjournal-001` (or any unique identifier)
3. Click **Create**

### Issue 4: Certificate Creation Disabled

Some Apple Developer accounts have restrictions on automatic certificate creation.

**Workaround - Use Xcode Cloud Signing:**

Edit your `codemagic.yaml` and change the iOS signing section to:

```yaml
environment:
  ios_signing:
    distribution_type: app_store
    bundle_identifier: com.jitsjournal.app
  xcode: latest
  cocoapods: default
```

Then replace the signing scripts with Xcode's automatic signing:

```yaml
- name: Enable automatic code signing
  script: |
    echo "🔐 Using Xcode automatic signing..."
    xcode-project use-profiles --export-options-plist=$CM_BUILD_DIR/ios/App/exportOptions.plist
```

## After Fixing

1. Commit your changes to GitHub
2. Push to main branch
3. Codemagic will automatically trigger a new build
4. Check the build logs for the "Fetch signing files" step - with `--verbose` it will show exactly what's happening

## Getting More Information

If the build fails again, check the Codemagic build logs:

1. Open the failed build in Codemagic
2. Click on the "Fetch signing files from Apple" step
3. Look for error messages - they will tell you exactly what's missing
4. Copy the full error message and we can diagnose from there

## Quick Checklist

Before triggering a new build, verify:

- [ ] Bundle ID `com.jitsjournal.app` exists in Apple Developer Portal → Identifiers
- [ ] App "Jits Journal" exists in App Store Connect → My Apps
- [ ] API Key has **App Manager** or **Admin** role (not Developer)
- [ ] API Key is correctly configured in Codemagic integration
- [ ] The bundle ID in `capacitor.config.ts` matches exactly: `com.jitsjournal.app`
- [ ] The bundle ID in `codemagic.yaml` matches exactly: `com.jitsjournal.app`
