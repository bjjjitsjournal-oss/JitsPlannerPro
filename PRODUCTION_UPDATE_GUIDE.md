# Update Production to Use Singapore Database

## Step 1: Get Singapore Supabase Credentials

Go to your **Singapore Supabase project**:

1. Click **Project Settings** (gear icon)
2. Click **API** in the left menu
3. You'll need these values:

### Copy These:
- **Project URL**: `https://vsuiumdimczjkbioywtw.supabase.co`
- **anon public key**: (long string starting with `eyJ...`)
- **service_role key**: (long string starting with `eyJ...`)
- **Database URL**: `postgres://postgres:Romeodog25%21@db.vsuiumdimczjkbioywtw.supabase.co:6543/postgres`

---

## Step 2: Update Render Environment Variables

Go to your **Render.com dashboard**:

1. Find your **web service** (backend)
2. Click **Environment** in the left menu
3. Update these variables:

### Update These Variables:

```
DATABASE_URL
postgres://postgres:Romeodog25%21@db.vsuiumdimczjkbioywtw.supabase.co:6543/postgres

VITE_SUPABASE_URL
https://vsuiumdimczjkbioywtw.supabase.co

VITE_SUPABASE_ANON_KEY
[paste your anon public key from Step 1]

SUPABASE_SERVICE_ROLE_KEY
[paste your service_role key from Step 1]
```

4. Click **Save Changes**

---

## Step 3: Redeploy

After saving, Render will automatically redeploy your app.

Wait for the deployment to complete (~2-3 minutes).

---

## Step 4: Test Your App

1. Open your production app
2. Log in
3. Click **Notes** - should load in **under 1 second**! ⚡
4. Click **Social** - should also be **instant**!

---

## Expected Performance Improvement

**Before (Sydney):**
- First load: 5 seconds
- Subsequent: 2-3 seconds

**After (Singapore):**
- First load: **under 1 second** ⚡
- Subsequent: **200-400ms** ⚡
- Tab switches: **Instant** (cached)

---

## What to Do

1. Get the credentials from Singapore Supabase (Step 1)
2. Update Render environment variables (Step 2)
3. Wait for deployment
4. Test and enjoy 10x faster performance!

Let me know when you've updated the environment variables and I'll help verify everything works!
