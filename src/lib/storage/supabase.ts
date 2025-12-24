import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Bucket name for CV files
export const CV_BUCKET_NAME = 'cvs'

// Maximum file size: 5MB
export const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed file types
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
