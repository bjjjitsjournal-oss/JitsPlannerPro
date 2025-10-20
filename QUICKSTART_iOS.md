# Quick Start: iOS Build with Codemagic (No Mac Needed!)

## ⚡ 5-Minute Setup

### 1. Create Accounts (5 min)

**Apple Developer** ($99/year)
- Go to: https://developer.apple.com/programs/enroll/
- Sign up and pay $99

**Codemagic** (FREE - 500 min/month)
- Go to: https://codemagic.io/signup
- Click "Sign up with GitHub"
- Free plan: 500 build minutes/month

### 2. Quick Configuration (10 min)

1. **Add repository to Codemagic**
   - Dashboard → Add application → Select your repo

2. **Enable automatic code signing**
   - App Settings → iOS code signing → Automatic
   - Log in with Apple ID → Codemagic does the rest!

3. **Get App Store Connect API key**
   - [App Store Connect](https://appstoreconnect.apple.com) → Users and Access → Keys
   - Generate → Download `.p8` file
   - Add to Codemagic: Teams → Integrations → App Store Connect

4. **Create app in App Store Connect**
   - My Apps → New App
   - Bundle ID: `com.jitsjournal.app`
   - Copy the App Store ID (10-digit number)

5. **Update `codemagic.yaml`**
   ```yaml
   vars:
     APP_STORE_APP_ID: 1234567890  # Your App Store ID
   
   publishing:
     email:
       recipients:
         - your@email.com  # Your email
   ```

6. **Push and build!**
   ```bash
   git add codemagic.yaml
   git commit -m "Configure Codemagic"
   git push origin main
   ```

7. **Start build in Codemagic**
   - Dashboard → Start new build
   - Select `ios-release` workflow
   - Click "Start new build"
   - Wait 8-12 minutes ☕

### 3. Done! 🎉

Your iOS app will automatically:
- ✅ Build in the cloud
- ✅ Upload to TestFlight
- ✅ Be ready for testing!

---

## 📖 Need More Help?

- **Full guide:** See `CODEMAGIC_SETUP_GUIDE.md`
- **Manual build (if you have a Mac):** See `IOS_BUILD_GUIDE.md`

---

## 💡 Tips

**Free tier includes:**
- 500 build minutes/month (~40-50 builds)
- Mac M2 machines (super fast!)
- TestFlight uploads
- All features unlocked

**Automatic builds trigger on:**
- Push to `main` branch
- Creating tags (e.g., `v1.0.43`)
- Pull requests

**Cost per build:**
- ~10-12 minutes per iOS build
- ~5-6 minutes per Android build
- With 500 free minutes = plenty of builds!

---

## 🚀 Next Steps After First Build

1. **Add TestFlight testers**
   - App Store Connect → TestFlight → Add testers

2. **Create App Store listing**
   - Add screenshots
   - Write description
   - Set pricing (Free)

3. **Configure subscriptions**
   - Product IDs: `bjj_enthusiast_monthly`, `gym_pro_monthly`
   - Prices: $9.99, $19.99

4. **Submit for review**
   - Change `submit_to_app_store: true` in `codemagic.yaml`
   - Push to trigger submission

5. **Launch!** 🎊
