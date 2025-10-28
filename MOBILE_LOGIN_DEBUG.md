# Mobile App Login Debugging Guide

## Quick Diagnosis

### Test 1: Check if app can reach the backend
Open the app on your Samsung phone and check if you can see the login screen. If yes, the Supabase credentials are working.

### Test 2: Try logging in with your existing account
- Email: bobygt@gmail.com
- Password: (your password)

**What error do you see?**

---

## Common Login Issues & Solutions

### Issue 1: "Invalid login credentials"
**Cause:** Wrong email/password OR email not confirmed  
**Solution:** 
1. Check if you confirmed your email when you first signed up
2. Try the "Forgot Password" flow if available
3. Or create a new account with a different email

### Issue 2: Nothing happens when clicking login
**Cause:** JavaScript error or network issue  
**Solution:** 
1. Check if you have internet connection
2. Try closing and reopening the app
3. Clear app cache: Settings → Apps → Jits Journal → Clear Cache

### Issue 3: "Email not confirmed"
**Cause:** Supabase requires email confirmation  
**Solution:**
1. Check your email for confirmation link
2. Click the link to confirm
3. Then try logging in again

### Issue 4: App crashes or goes back to white screen
**Cause:** Build issue  
**Solution:**
1. Verify the build has credentials (you already did this)
2. Uninstall completely and reinstall
3. Restart phone

---

## For Testing: Create a Test Account

Try creating a NEW account directly in the app:
1. Click "Sign Up" or "Create Account"
2. Use a different email (not bobygt@gmail.com)
3. Fill in first name, last name
4. Create password (8+ characters)
5. Click Sign Up
6. Check your email for confirmation link
7. Click link, then try logging in

---

## Backend Connection Test

The mobile app connects to: `https://bjj-jits-journal.onrender.com`

If login fails with network errors, the Render server might be asleep (free tier). Wait 30-60 seconds and try again.

---

## What to tell me:

1. **Exact error message you see** (screenshot if possible)
2. **Are you trying to log in or sign up?**
3. **Does the button respond at all?**
4. **Did you confirm your email when you first registered?**

This will help me fix the exact issue you're experiencing.
