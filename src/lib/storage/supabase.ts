import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Bucket names
export const CV_BUCKET_NAME = 'cvs'
export const AVATAR_BUCKET_NAME = 'avatars'
export const VIDEO_BUCKET_NAME = 'videos'

// Maximum file sizes
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB for CVs
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB for avatars
export const MAX_VIDEO_SIZE = 30 * 1024 * 1024 // 30MB for videos

// Allowed file types
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov files
]

/**
 * Upload a CV file to Supabase Storage
 */
export async function uploadCV(
  file: File,
  userId: string,
  profileId: string
): Promise<{ url: string; path: string }> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `Le fichier est trop volumineux. Taille maximum : ${MAX_FILE_SIZE / 1024 / 1024}MB`
    )
  }

  // Validate file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error('Type de fichier non autorisé. Utilisez un fichier PDF ou DOCX')
  }

  // Generate unique file path
  const fileExtension = file.name.split('.').pop()
  const fileName = `${userId}/${profileId}-${Date.now()}.${fileExtension}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(CV_BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Supabase upload error:', error)
    throw new Error('Erreur lors du téléchargement du fichier')
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(CV_BUCKET_NAME).getPublicUrl(data.path)

  return {
    url: publicUrl,
    path: data.path,
  }
}

/**
 * Delete a CV file from Supabase Storage
 */
export async function deleteCV(filePath: string): Promise<void> {
  const { error } = await supabase.storage.from(CV_BUCKET_NAME).remove([filePath])

  if (error) {
    console.error('Supabase delete error:', error)
    throw new Error('Erreur lors de la suppression du fichier')
  }
}

/**
 * Get the file path from a public URL
 */
export function getFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/cvs\/(.+)/)
    return pathMatch && pathMatch[1] ? pathMatch[1] : null
  } catch {
    return null
  }
}

/**
 * Upload an avatar image to Supabase Storage
 */
export async function uploadAvatar(
  file: File,
  userId: string,
  profileId: string
): Promise<{ url: string; path: string }> {
  // Validate file size
  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error(
      `L'image est trop volumineuse. Taille maximum : ${MAX_AVATAR_SIZE / 1024 / 1024}MB`
    )
  }

  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Type de fichier non autorisé. Utilisez une image JPG, PNG ou WebP')
  }

  // Generate unique file path
  const fileExtension = file.name.split('.').pop()
  const fileName = `${userId}/${profileId}-${Date.now()}.${fileExtension}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Supabase upload error:', error)
    throw new Error('Erreur lors du téléchargement de l\'image')
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET_NAME).getPublicUrl(data.path)

  return {
    url: publicUrl,
    path: data.path,
  }
}

/**
 * Delete an avatar image from Supabase Storage
 */
export async function deleteAvatar(filePath: string): Promise<void> {
  const { error } = await supabase.storage.from(AVATAR_BUCKET_NAME).remove([filePath])

  if (error) {
    console.error('Supabase delete error:', error)
    throw new Error('Erreur lors de la suppression de l\'image')
  }
}

/**
 * Get the avatar file path from a public URL
 */
export function getAvatarPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/avatars\/(.+)/)
    return pathMatch && pathMatch[1] ? pathMatch[1] : null
  } catch {
    return null
  }
}

/**
 * Upload a video file to Supabase Storage (PRO+ feature)
 *
 * Video Business Card requirements:
 * - Max size: 30MB
 * - Max duration: 30 seconds (validated client-side)
 * - Formats: MP4, WebM, MOV
 * - No transcoding (user must compress before upload)
 *
 * @param file - The video file to upload
 * @param userId - The user's ID (for folder organization)
 * @param profileId - The profile's ID (for file naming)
 * @returns Object containing the public URL and file path
 *
 * @throws Error if file is too large or wrong type
 *
 * @example
 * ```typescript
 * const { url, path } = await uploadVideo(file, userId, profileId)
 * await prisma.profile.update({
 *   where: { id: profileId },
 *   data: { videoUrl: url }
 * })
 * ```
 */
export async function uploadVideo(
  file: File,
  userId: string,
  profileId: string
): Promise<{ url: string; path: string }> {
  // Validate file size
  if (file.size > MAX_VIDEO_SIZE) {
    throw new Error(
      `La vidéo est trop volumineuse. Taille maximum : ${MAX_VIDEO_SIZE / 1024 / 1024}MB`
    )
  }

  // Validate file type
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    throw new Error('Type de fichier non autorisé. Utilisez MP4, WebM ou MOV')
  }

  // Generate unique file path
  const fileExtension = file.name.split('.').pop()
  const fileName = `${userId}/${profileId}-${Date.now()}.${fileExtension}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(VIDEO_BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Supabase video upload error:', error)
    throw new Error('Erreur lors du téléchargement de la vidéo')
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(VIDEO_BUCKET_NAME).getPublicUrl(data.path)

  return {
    url: publicUrl,
    path: data.path,
  }
}

/**
 * Delete a video file from Supabase Storage
 *
 * @param filePath - The file path from storage (e.g., "userId/profileId-timestamp.mp4")
 * @throws Error if deletion fails
 *
 * @example
 * ```typescript
 * const oldPath = getVideoPathFromUrl(profile.videoUrl)
 * if (oldPath) {
 *   await deleteVideo(oldPath)
 * }
 * ```
 */
export async function deleteVideo(filePath: string): Promise<void> {
  const { error } = await supabase.storage.from(VIDEO_BUCKET_NAME).remove([filePath])

  if (error) {
    console.error('Supabase video delete error:', error)
    throw new Error('Erreur lors de la suppression de la vidéo')
  }
}

/**
 * Get the video file path from a public URL
 *
 * @param url - The full Supabase public URL
 * @returns The file path within the bucket, or null if invalid URL
 *
 * @example
 * ```typescript
 * const url = "https://xxx.supabase.co/storage/v1/object/public/videos/user123/profile456.mp4"
 * const path = getVideoPathFromUrl(url)
 * // Returns: "user123/profile456.mp4"
 * ```
 */
export function getVideoPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/videos\/(.+)/)
    return pathMatch && pathMatch[1] ? pathMatch[1] : null
  } catch {
    return null
  }
}
