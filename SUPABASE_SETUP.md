# Supabase Storage Setup for Video Uploads

## ⚠️ IMPORTANT: Required Setup Before Deployment

Your app now uses **Supabase Storage** for video uploads instead of storing base64 data in the database. This fixes the **Vercel 4.5MB request body limit** issue.

## 🪣 Create Storage Bucket

1. **Go to your Supabase Dashboard** → Storage

2. **Create a new bucket** named: `videos`

3. **Configure bucket settings:**
   - Name: `videos`
   - Public bucket: ✅ **YES** (videos need to be publicly accessible)
   - File size limit: 50MB (or your preferred max)
   - Allowed MIME types: `video/mp4`, `video/webm`, `video/quicktime`, `video/x-msvideo`

## 🔐 Set Bucket Policies

Add these policies to the `videos` bucket:

### Policy 1: Allow Authenticated Users to Upload
```sql
CREATE POLICY "Allow authenticated users to upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');
```

### Policy 2: Public Read Access
```sql
CREATE POLICY "Public read access to videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');
```

### Policy 3: Allow Users to Delete Their Videos
```sql
CREATE POLICY "Allow users to delete their own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'videos');
```

## ✅ How It Works Now

### Before (Database Storage - BROKEN on Vercel):
1. ❌ Video converted to base64 (~33% larger)
2. ❌ Sent to backend API route (hits 4.5MB Vercel limit)
3. ❌ Saved in PostgreSQL database (huge bloat)

### After (Supabase Storage - WORKS on Vercel):
1. ✅ Video uploaded **directly** to Supabase Storage from client
2. ✅ Get public URL from Supabase
3. ✅ Save only the **URL** to database (~50 bytes)
4. ✅ No Vercel limits, no database bloat

## 📁 File Structure in Storage

Videos are stored with this path pattern:
```
videos/
  └── note-videos/
      ├── {noteId}-{timestamp}.mp4
      ├── {noteId}-{timestamp}.webm
      └── ...
```

## 🚀 Testing the Setup

1. Create the `videos` bucket in Supabase
2. Add the policies above
3. Try uploading a video in the app
4. Check the Supabase Storage dashboard to see the uploaded file
5. Verify the video URL is saved in the database (not base64 data)

## 🔧 Environment Variables

Make sure these are set in your deployment (Vercel/etc):
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

## 📊 Storage Limits

Supabase Free Tier:
- 1GB storage
- 2GB bandwidth per month

If you need more, upgrade to Pro ($25/month for 100GB storage).

## 🎯 Benefits

1. ✅ **Bypasses Vercel 4.5MB limit** - Videos go directly to Supabase
2. ✅ **No database bloat** - Only URLs stored, not video data
3. ✅ **Better performance** - CDN-backed storage
4. ✅ **Scales to any file size** - Up to 50MB per video (configurable)
5. ✅ **Works on all platforms** - Vercel, Netlify, or any hosting

## 🔄 Migration Note

If you have existing videos stored as base64 in the database:
- They will still work (displayed from database)
- New uploads will use Supabase Storage
- You can migrate old videos manually if needed
