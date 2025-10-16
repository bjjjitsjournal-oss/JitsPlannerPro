# Codemagic iOS Build Setup - Jits Journal

Super easy setup! Codemagic handles certificates and provisioning profiles automatically.

## Step 1: Create Codemagic Account (2 minutes)

1. Go to https://codemagic.io
2. Sign up with GitHub (or your Git provider)
3. Free tier: 500 macOS minutes/month

## Step 2: Create App Store Connect API Key (5 minutes)

This lets Codemagic handle certificates automatically.

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to: **Users and Access** → **Keys** tab
3. Click **+** to create new API key
4. Name it: "Codemagic"
5. Access: **App Manager**
6. Click **Generate**
7. **Download the `.p8` file** (you can only download once!)
8. Copy these values:
   - **Issuer ID** (top of page)
   - **Key ID** (in the key row)

## Step 3: Add API Key to Codemagic (2 minutes)

1. In Codemagic, go to **Teams** → **Integrations**
2. Click **App Store Connect**
3. Add integration:
   - **Name**: "Jits Journal API"
   - **Issuer ID**: (paste from Step 2)
   - **Key ID**: (paste from Step 2)
   - **API Key file**: Upload the `.p8` file
4. Click **Save**

## Step 4: Add Your App to Codemagic (3 minutes)

1. Click **Applications** → **Add application**
2. Connect your Git repository (GitHub/GitLab/Bitbucket)
3. Select **JitsPlannerPro** repository
4. Project type: **Ionic Capacitor**
5. Click **Finish setup**

## Step 5: Configure App (2 minutes)

1. In your app settings, go to **Environment variables**
2. Add variable:
   - Name: `APP_STORE_APP_ID`
   - Value: Your App ID from App Store Connect (found in app details)
3. Update `codemagic.yaml` line 17 to uncomment and add your App ID

## Step 6: Update Your Email

Edit `codemagic.yaml` line 54:
```yaml
recipients:
  - your-actual-email@example.com
```

## Step 7: Push & Build! (1 minute)

```powershell
cd C:\Projects\JitsPlannerPro
git add .
git commit -m "Add Codemagic iOS build configuration"
git push origin main
```

Codemagic will automatically:
- ✅ Build your iOS app
- ✅ Generate certificates & provisioning profiles
- ✅ Upload to TestFlight
- ✅ Email you when done

## Build Time & Cost

- **Build time**: 5-15 minutes
- **Cost**: ~500 free minutes/month = ~30-50 free builds
- **After free tier**: ~$0.10/minute (~$1-2 per build)

## Viewing Your Build

1. Go to Codemagic dashboard
2. Click on **Jits Journal** app
3. Watch the build progress
4. Download IPA from **Artifacts** when complete
5. Build automatically uploads to TestFlight!

## Troubleshooting

**Build fails at "code signing"**
- Make sure App Store Connect API key is added correctly
- Verify bundle ID matches: `com.jitsjournal.app`

**"Agreement missing" error**
- Accept all agreements in App Store Connect

**Email notifications not working**
- Update your email in `codemagic.yaml` line 54

## That's It!

Push to main branch → Codemagic builds → TestFlight gets the app → Done! 🎉

Much easier than manual certificates!
