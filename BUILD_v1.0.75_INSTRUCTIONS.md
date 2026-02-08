# Build Instructions for v1.0.75 - Mobile Performance Fix (REAL FIX)

## What's Fixed in v1.0.75

### The Problem (v1.0.72 and earlier - PLUS v1.0.73 incomplete fix)
- Mobile app had severe performance issues with 5-10 second delays on Notes/Social pages
- Add/delete note and video operations showed errors before eventually working
- Root cause: Every API request called `supabase.auth.getSession()` which crosses the slow Capacitor bridge
- Multiple parallel queries (notes, gym, social) all hit this slow path on cold start
- Backend couldn't use fast local JWT verification without Authorization header
- **v1.0.73 ISSUE**: Fixed frontend to send auth headers, but backend `flexibleAuth` middleware still used SLOW Supabase API calls

### The Solution (v1.0.75 - COMPLETE FIX)
**Authorization Header Caching**
1. ✅ Cache Supabase access token in Capacitor Preferences on login (survives app restarts)
2. ✅ Send `Authorization: Bearer <token>` header with ALL API requests
3. ✅ Backend uses fast local JWT verification (<1ms) instead of slow Supabase calls
4. ✅ Eliminates slow Capacitor bridge calls to getSession()

**Expected Performance Improvements:**
- Notes/Social pages: 5-10 seconds → <1 second load time
- Add/delete operations: No more errors, instant response
- Cold app start: All queries load in parallel without delays

## Build Process

### Version Numbers
- Android: versionCode **75**, versionName **1.0.75**
- iOS: MARKETING_VERSION **1.0.75**

### Android Build (PowerShell on Windows)

```powershell
# 1. Build web app
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Navigate to android directory
cd android

# 4. Clean build (recommended)
.\gradlew clean

# 5. Build release AAB for Google Play
.\gradlew bundleRelease
```

**Output Location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

**Upload to:**
- Google Play Console → Production track
- Version code 75 will auto-increment from v72/73

### iOS Build (Codemagic Cloud)

See `CODEMAGIC_SETUP_GUIDE.md` for cloud build instructions.

Or if building locally with Mac:
```bash
npm run build
npx cap sync ios
cd ios/App
# Open in Xcode and Archive
```

## Testing Checklist

### Web (Vercel) - Regression Testing
- [ ] Login works
- [ ] Notes load quickly
- [ ] Add/delete notes work
- [ ] Video upload works
- [ ] Social page loads
- [ ] Dashboard loads

### Mobile (v1.0.73) - Performance Testing
- [ ] **Cold start**: Close app completely, reopen
  - Notes page should load in <1 second (vs 5-10 seconds in v1.0.72)
  - Look for console log: `🔑 Query with Authorization header (fast path!)`
- [ ] **Add note**: Should save instantly without errors
- [ ] **Delete note**: Should delete instantly without errors
- [ ] **Video upload**: Should work without timeout errors
- [ ] **Social page**: Should load in <1 second
- [ ] **Logout/Login**: Should work smoothly

### Backend Monitoring (Render.com)
After deploying v1.0.73 mobile builds, check Render logs for:
- ✅ More requests hitting fast JWT verification path
- ✅ Fewer requests falling back to flexibleAuth
- ✅ Overall response times improved

## Key Code Changes

**Files Modified:**
1. `client/src/lib/queryClient.ts`
   - Added `setCachedAccessToken()` and `getAccessToken()`
   - Modified `queryFn` to send Authorization header
   - Modified `apiRequest` to send Authorization header

2. `client/src/contexts/AuthContext.tsx`
   - Cache access token on login alongside user ID
   - Clear access token on logout
   - Persist to Capacitor Preferences for mobile

**Console Logs to Watch For:**
- `🔑 Persisted access token to Preferences` - Token cached successfully
- `🔑 Loaded access token from Preferences (instant!)` - Fast retrieval working
- `🔑 Query with Authorization header (fast path!)` - Using fast backend path
- `🔑 Mutation with Authorization header (fast path!)` - Mutations optimized

## Deployment Order

1. **Web (Vercel)**: Auto-deploys on git push to main
2. **Backend (Render)**: Already has SUPABASE_JWT_SECRET configured
3. **Android**: Upload AAB to Google Play → Internal Testing first
4. **iOS**: Submit via Codemagic or App Store Connect

## Rollback Plan

If v1.0.73 causes issues:
- Backend is backward compatible (still accepts supabaseId param)
- Users on v1.0.72 will continue working
- Simply don't promote v1.0.73 to production

## Known Limitations

- Users must **log out and back in** to get the performance improvements
  - This populates the cached access token
  - Existing sessions won't have token cached yet
- Token expires and auto-refreshes via Supabase (handled automatically)

## Questions?

If mobile app still has delays after v1.0.73:
1. Check console logs - should see "fast path" messages
2. Try logout/login to refresh token cache
3. Check Render backend logs for JWT verification success
4. Verify SUPABASE_JWT_SECRET is set on Render

---

**Previous Builds:**
- v1.0.72: JWT verification fix (partial improvement)
- v1.0.71: Mobile bundler fix
- v1.0.70 and earlier: Various feature additions

**Build Date:** October 25, 2025
**Architect Reviewed:** ✅ Yes
**Expected Impact:** 3-4x faster mobile performance
