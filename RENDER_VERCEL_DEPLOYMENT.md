# Complete Deployment Guide: Render + Vercel + Google Play

Your app is now split across two services:
- **Backend (Render)**: https://bjj-jits-journal.onrender.com
- **Frontend (Vercel)**: Will be deployed separately
- **Mobile (Google Play)**: AAB builds connect to Render backend

---

## ✅ Backend Already Deployed on Render

Your Express backend is live at: **https://bjj-jits-journal.onrender.com**

Environment variables already set on Render:
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `JWT_SECRET` - Your JWT signing key
- `NODE_ENV=production`
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `PORT=5000` - Render will use this port

**Note**: Render free tier spins down after 15 minutes of inactivity. First request after sleep takes ~30 seconds to wake up.

---

## 🚀 Deploy Frontend to Vercel

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy to Production
```bash
vercel --prod
```

### Step 4: Set Environment Variables in Vercel Dashboard

Go to your Vercel project → Settings → Environment Variables and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_BASE_URL` | `https://bjj-jits-journal.onrender.com` | **CRITICAL** - Points frontend to Render backend |
| `VITE_SUPABASE_URL` | `https://umotigprfosrrjwpxlnp.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Your Supabase anon key |
| `VERCEL_FORCE_NO_BUILD_CACHE` | `1` | Forces fresh builds |

**⚠️ CRITICAL**: After adding environment variables, you MUST **redeploy** for them to take effect:
```bash
vercel --prod
```

---

## 📱 Build Android AAB for Google Play (Version 6)

Your Android version has been updated to version 6.

### Option A: EAS Build (Cloud - Recommended)

1. **Install EAS CLI**:
```bash
npm install -g eas-cli
```

2. **Login to Expo**:
```bash
eas login
```

3. **Build AAB for Google Play**:
```bash
eas build --platform android --profile production
```

4. Wait for cloud build to complete (~10-15 minutes)
5. Download the AAB from the link provided
6. Upload to Google Play Console

### Option B: Local Build (Requires Android Studio)

1. **Build production web app**:
```bash
npm run build
```

2. **Sync with Capacitor**:
```bash
npx cap sync android
```

3. **Build AAB**:
```bash
cd android
./gradlew bundleRelease
```

4. AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

### ⚠️ IMPORTANT: Mobile App Backend Configuration

Your mobile app needs to know where the backend is. Currently it uses relative paths which won't work.

**For production mobile builds, you need to:**

1. Set the backend URL in `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  // ... existing config
  server: {
    androidScheme: 'https',
    url: 'https://bjj-jits-journal.onrender.com', // Add this line
  },
};
```

**OR** (better approach) - Add to your build environment:

```bash
VITE_API_BASE_URL=https://bjj-jits-journal.onrender.com npm run build
npx cap sync android
cd android && ./gradlew bundleRelease
```

---

## 🔄 Workflow for Future Updates

### When you make changes in Replit:

1. **Test locally** in Replit to verify everything works

2. **Push changes to Git** (if using GitHub):
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

3. **Redeploy Vercel frontend** (if frontend changed):
   ```bash
   vercel --prod
   ```

4. **Redeploy Render backend** (if backend changed):
   - Render auto-deploys from GitHub if connected
   - OR manually trigger deploy in Render dashboard

5. **Rebuild AAB for mobile** (if releasing app update):
   ```bash
   npm run build
   npx cap sync android
   cd android && ./gradlew bundleRelease
   ```
   Then upload new AAB to Google Play Console

---

## 🧪 Testing Your Deployment

### Test Backend (Render):
```bash
curl https://bjj-jits-journal.onrender.com/api/health
```

### Test Frontend (Vercel):
1. Open your Vercel URL in browser
2. Try to log in
3. Check browser console for API calls
4. Verify they're hitting: `https://bjj-jits-journal.onrender.com/api/...`

### Test Mobile App:
1. Install AAB on test device
2. Try to log in
3. Create a class, note, or upload video
4. Verify data persists across app restarts

---

## ⚠️ Common Issues & Fixes

### Issue: "Network Error" or API calls fail
**Fix**: Make sure `VITE_API_BASE_URL` is set in Vercel and you redeployed after adding it

### Issue: Mobile app can't connect to backend
**Fix**: Ensure `VITE_API_BASE_URL` is set during the build process or added to capacitor.config.ts

### Issue: Render backend is slow on first request
**Expected**: Free tier spins down after 15 min. First request takes ~30s to wake up. Consider upgrading to paid tier for instant responses.

### Issue: Video uploads fail
**Fix**: Make sure you created the Supabase Storage bucket. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### Issue: Changes in Replit don't appear on Vercel
**Fix**: You must redeploy Vercel after making changes:
```bash
vercel --prod
```

---

## 💰 Cost Breakdown

| Service | Free Tier | Notes |
|---------|-----------|-------|
| **Vercel** | 100GB bandwidth/month | Usually sufficient for small apps |
| **Render** | 750 hours/month (1 service) | Spins down after 15 min inactivity |
| **Supabase** | 500MB database, 1GB storage | Auth + Database + Storage included |
| **Neon** | 0.5GB database | PostgreSQL database (if using instead of Supabase) |

**Total cost on free tier: $0/month** (with limitations)

To handle more users:
- Render Paid: $7/month (always-on, no spin down)
- Vercel Pro: $20/month (more bandwidth, better performance)
- Supabase Pro: $25/month (8GB database, 100GB storage)

---

## 📊 Expected Performance on Free Tier

- **Concurrent users**: 50-100 (limited by Render free tier)
- **Video uploads**: Limited by Supabase free storage (1GB total)
- **Database**: 500MB in Supabase free tier
- **First request latency**: ~30 seconds (Render wake up time)
- **Subsequent requests**: <500ms

**When to upgrade**:
- If you get 100+ daily active users → Upgrade Render ($7/mo)
- If videos exceed 1GB → Upgrade Supabase ($25/mo)
- If users complain about slow first load → Upgrade Render to always-on

---

## ✅ Deployment Checklist

- [ ] Backend deployed on Render: https://bjj-jits-journal.onrender.com
- [ ] Frontend deployed on Vercel with `VITE_API_BASE_URL` set
- [ ] Supabase Storage bucket created (see SUPABASE_SETUP.md)
- [ ] AAB version 6 built and uploaded to Google Play
- [ ] Tested login/signup on web app
- [ ] Tested video upload on web app
- [ ] Tested mobile app on physical device
- [ ] Verified data persists across sessions

---

## 🎯 Quick Commands Reference

```bash
# Deploy Vercel frontend
vercel --prod

# Build Android AAB (local)
npm run build && npx cap sync android && cd android && ./gradlew bundleRelease

# Build Android AAB (cloud)
eas build --platform android --profile production

# Test backend
curl https://bjj-jits-journal.onrender.com/api/health
```
