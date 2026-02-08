# Fix: "No matching profiles found for bundle identifier"

## 🔍 What This Error Means

Codemagic can't find a provisioning profile for `com.jitsjournal.app` because:
1. The bundle ID hasn't been registered in Apple Developer Portal yet
2. Or a provisioning profile doesn't exist for it

## ✅ Solution: Register Your App ID (5 minutes)

### Step 1: Register Bundle Identifier in Apple Developer Portal

1. **Log in to Apple Developer Portal**
   - Go to: https://developer.apple.com/account/
   - Click **Certificates, Identifiers & Profiles**

2. **Create an App ID**
   - Click **Identifiers** (left sidebar)
   - Click the **+ (plus)** button
   - Select **App IDs** → Click **Continue**

3. **Configure Your App ID**
   - **Description:** Jits Journal
   - **Bundle ID:** Select **Explicit**
   - **Bundle ID field:** `com.jitsjournal.app` (exactly as shown)
   - **Capabilities:** Select what you need:
     - ✅ Associated Domains (if using web links)
     - ✅ Push Notifications (if using notifications)
     - ✅ In-App Purchase (for subscriptions)
     - ✅ Sign in with Apple (if using)
   - Click **Continue**
   - Click **Register**

### Step 2: Choose Your Code Signing Method

You have two options:

#### **Option A: Automatic (Recommended - Easiest!)**

Let Codemagic create the provisioning profile for you:

1. **In Codemagic, go to your app settings**
2. **Click: iOS code signing → Automatic**
3. **Enable automatic code signing**
4. **Log in with your Apple ID** when prompted
5. Codemagic will automatically:
   - Create the provisioning profile
   - Link it to your bundle ID
   - Handle everything for you!

6. **Run the build again** - It should work now!

#### **Option B: Manual (If automatic doesn't work)**

Create the provisioning profile manually:

1. **In Apple Developer Portal:**
   - Go to **Profiles** → Click **+**
   - Select **App Store** → Continue
   - Select your App ID: `com.jitsjournal.app`
   - Select your **Distribution Certificate**
   - Name it: `Jits Journal App Store`
   - Click **Generate**
   - **Download** the `.mobileprovision` file

2. **In Codemagic:**
   - Go to **Team settings** → **Code signing identities**
   - Click **iOS provisioning profiles** tab
   - Click **Upload profile**
   - Upload the `.mobileprovision` file
   - Give it a reference name: `jits_journal_app_store`

3. **Update your `codemagic.yaml`:**
   ```yaml
   environment:
     ios_signing:
       provisioning_profiles:
         - jits_journal_app_store
       certificates:
         - your_certificate_reference
   ```

### Step 3: Verify Distribution Certificate Exists

You also need a Distribution certificate:

1. **Check in Codemagic:**
   - Team settings → Code signing identities → iOS certificates
   - You should see a **Distribution** certificate

2. **If you don't have one, let automatic signing create it:**
   - Use Option A above (automatic signing)
   - OR manually create in Apple Developer Portal:
     - Certificates → + → iOS Distribution
     - Follow prompts to create
     - Download and upload to Codemagic

### Step 4: Run Build Again

1. Go to Codemagic dashboard
2. Click **Start new build**
3. Select **ios-release** workflow
4. Click **Start new build**

It should work now! ✅

---

## 🚨 Common Mistakes to Avoid

### ❌ Wrong: Bundle ID Mismatch
- Codemagic YAML: `com.jitsjournal.app`
- Apple Portal: `com.jitsJournal.app` (capital J)
- **These must match EXACTLY** (case-sensitive!)

### ❌ Wrong: Using Development Certificate
- For App Store builds, you need **Distribution** certificate
- Not Development certificate

### ❌ Wrong: Profile Expired
- Check expiration date in Apple Developer Portal
- Regenerate if needed

### ❌ Wrong: Missing Capabilities
- If you added capabilities (Push, In-App Purchase, etc.)
- You must regenerate the provisioning profile

---

## 🎯 Quick Checklist

Before running build again:

- [ ] Bundle ID registered in Apple Developer Portal: `com.jitsjournal.app`
- [ ] Capabilities selected (In-App Purchase, Push Notifications, etc.)
- [ ] Distribution certificate exists in Codemagic
- [ ] Either:
  - [ ] Automatic code signing enabled in Codemagic, OR
  - [ ] Provisioning profile uploaded to Codemagic
- [ ] Bundle ID in YAML matches Apple Developer Portal exactly

---

## 💡 Recommended Approach

**Use Automatic Code Signing!** It's the easiest:

1. Register bundle ID in Apple Developer Portal (Step 1 above)
2. Enable automatic signing in Codemagic
3. Log in with Apple ID
4. Done! Codemagic handles everything else

This way you don't have to:
- ❌ Create certificates manually
- ❌ Create provisioning profiles manually
- ❌ Upload files to Codemagic
- ❌ Worry about expiration

Codemagic does it all automatically! 🎉

---

## 📞 Still Having Issues?

If you still get the error:

1. **Double-check bundle ID spelling:**
   - Apple Portal: _______________________
   - codemagic.yaml: `com.jitsjournal.app`
   - Do they match exactly?

2. **Screenshot the error and share:**
   - The full error message from Codemagic build logs
   - Your `ios_signing` section in codemagic.yaml

3. **Check Codemagic build logs:**
   - Look for any other errors before this one
   - Sometimes there's a certificate error first

---

**Next:** After fixing this, your build should complete successfully! 🚀
