# Singapore Database Migration - Step by Step

## Step 1: Set Your Password (DO THIS FIRST!)

In your terminal, run:
```bash
export SINGAPORE_DB_PASSWORD="your_actual_password_here"
```
*Replace `your_actual_password_here` with the real password*

## Step 2: Create Database Schema in Singapore

```bash
# Set Singapore database URL temporarily
export TEMP_SINGAPORE_URL="postgresql://postgres:${SINGAPORE_DB_PASSWORD}@db.vsuiumdimczjkbioywtw.supabase.co:5432/postgres"

# Push schema to Singapore database
DATABASE_URL=$TEMP_SINGAPORE_URL npm run db:push
```

This creates all the tables in your Singapore database.

## Step 3: Copy All Data from Sydney to Singapore

```bash
tsx copy_data_to_singapore.ts
```

This copies all your:
- Users
- Classes  
- Notes
- Belt progression
- Weekly goals
- Game plans
- Gyms and memberships

## Step 4: Verify Migration

The script will show you how many records were copied. Check that the numbers look correct!

## Step 5: Update Production (After Testing)

Once migration is successful, update these in your **Render dashboard**:

1. `DATABASE_URL` → `postgresql://postgres:YOUR_PASSWORD@db.vsuiumdimczjkbioywtw.supabase.co:5432/postgres`
2. `VITE_SUPABASE_URL` → `https://vsuiumdimczjkbioywtw.supabase.co`
3. `VITE_SUPABASE_ANON_KEY` → (get from Singapore project API settings)
4. `SUPABASE_SERVICE_ROLE_KEY` → (get from Singapore project API settings)

Then **redeploy** your app!

## Expected Result

Load times drop from **5 seconds → under 1 second**! ⚡

---

Ready to start? Run Step 1 first, then let me know when you're ready for Step 2!
