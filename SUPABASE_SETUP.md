# Supabase Storage Setup Guide

This guide outlines the manual configuration steps required in the Supabase Dashboard to enable video uploads for the SmartLink premium features.

## Videos Bucket Configuration

### 1. Create the 'videos' Bucket

1. Go to **Supabase Dashboard** → Your Project → **Storage**
2. Click **"New bucket"**
3. Configure:
   - **Name**: `videos`
   - **Public bucket**: ✅ **Yes** (videos need to be publicly accessible on profile pages)
   - **File size limit**: `30 MB`
   - **Allowed MIME types**: `video/mp4, video/webm, video/quicktime`

### 2. Configure Row Level Security (RLS) Policies

Navigate to **Storage** → **videos** → **Policies** and create the following policies:

#### Policy 1: Users can upload videos to their own folder

```sql
-- Name: Users can upload videos to their own folder
-- Operation: INSERT
-- Target roles: authenticated

CREATE POLICY "Users can upload videos to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**What this does**: Authenticated users can only upload videos to folders named with their user ID (e.g., `userId/video.mp4`). This prevents users from uploading to other users' folders.

#### Policy 2: Anyone can view videos (public profiles)

```sql
-- Name: Anyone can view videos
-- Operation: SELECT
-- Target roles: public

CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');
```

**What this does**: Allows public access to all videos (required for public profile pages to display videos without authentication).

#### Policy 3: Users can delete their own videos

```sql
-- Name: Users can delete their own videos
-- Operation: DELETE
-- Target roles: authenticated

CREATE POLICY "Users can delete their own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**What this does**: Users can only delete videos from their own folder, preventing unauthorized deletions.

---

## Existing Buckets (Already Configured)

These buckets should already exist from the initial setup:

### 'avatars' Bucket
- **Public**: Yes
- **Size limit**: 2 MB
- **MIME types**: `image/jpeg, image/jpg, image/png, image/webp`

### 'cvs' Bucket
- **Public**: Yes
- **Size limit**: 5 MB
- **MIME types**: `application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document`

---

## Verification

After setup, verify the configuration:

1. **Test Upload** (via app):
   ```typescript
   // This should succeed for authenticated users
   const { url, path } = await uploadVideo(file, userId, profileId)
   ```

2. **Test Public Access**:
   - Visit the public URL returned from upload
   - Should be accessible without authentication
   - Example: `https://xxx.supabase.co/storage/v1/object/public/videos/userId/profileId-timestamp.mp4`

3. **Test Permissions**:
   - Try uploading to another user's folder → Should fail
   - Try deleting another user's video → Should fail
   - Try accessing video as anonymous user → Should succeed

---

## Troubleshooting

### Error: "new row violates row-level security policy"
**Solution**: Ensure the RLS policies are created correctly and the user is authenticated.

### Error: "413 Payload Too Large"
**Solution**: Check that the file is under 30MB. Files above this limit should be compressed before upload.

### Error: "Bucket not found"
**Solution**: Verify the bucket name is exactly `videos` (lowercase, no spaces).

### Videos not loading on public profiles
**Solution**:
1. Check that "Public bucket" is enabled
2. Verify the SELECT policy allows public access
3. Check the CORS configuration (should be enabled by default)

---

## Security Notes

### RGPD/GDPR Compliance
- Videos are stored with user consent (upload action)
- Users can delete their videos at any time
- No metadata beyond storage timestamp is collected
- Videos are not analyzed or processed

### Storage Costs (Supabase Free Tier)
- **Storage**: 1 GB free (approximately 30-50 videos at 30MB each)
- **Bandwidth**: 2 GB/month free (approximately 70 video views)
- **Upgrade to Pro**: $25/month for 100 GB storage + 200 GB bandwidth

### Best Practices
1. **Client-side validation**: Always validate file size and duration before upload
2. **Compression recommendation**: Suggest users compress videos to ~10-15MB
3. **Delete old videos**: When user uploads new video, delete the old one to save storage
4. **Monitor usage**: Check Supabase Dashboard → Settings → Usage regularly

---

## Next Steps

After completing this setup:
1. ✅ Bucket `videos` created with RLS policies
2. → Test video upload via VideoUpload component
3. → Implement video display on public profile pages
4. → Add tier enforcement (PRO+ only)
5. → Deploy to production and verify CORS settings

---

**Last Updated**: December 26, 2024
**Related Files**:
- `src/lib/storage/supabase.ts` (upload/delete functions)
- `src/components/profile/video-upload.tsx` (UI component)
- `src/app/api/upload/video/route.ts` (API endpoint)
