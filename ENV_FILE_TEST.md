# Critical: Did you create the .env file on Windows?

The blank white screen means the Android app doesn't have Supabase credentials.

## Test if .env file exists on your Windows machine

Run this in PowerShell:

```powershell
cd C:\Projects\JitsPlannerPro
cat .env
```

### Expected output:
```
VITE_SUPABASE_URL=https://umotigprfosrrjwpxlnp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtb3RpZ3ByZm9zcnJqd3B4bG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAzMzQ4NDAsImV4cCI6MjAzNTkxMDg0MH0.d5yLGYOSzwvf0a2mR8XMIJo9mxgOAXZqSW8E6QdO7QU
VITE_API_BASE_URL=https://bjj-jits-journal.onrender.com
```

### If you get an error or it doesn't show this:
The .env file doesn't exist or is wrong. That's why you have a white screen.

## What to check

After you create the .env file and run `npm run build`, verify the credentials are in the bundle:

```powershell
Select-String -Path "dist/public/assets/index-*.js" -Pattern "umotigprfosrrjwpxlnp"
```

You should see output like:
```
dist/public/assets/index-xxxxx.js:1:...umotigprfosrrjwpxlnp...
```

If you see nothing, the .env file wasn't read during the build.
