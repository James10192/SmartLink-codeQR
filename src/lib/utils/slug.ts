/**
 * Slug Generation Utilities
 *
 * Creates SEO-friendly short slugs for profiles and secure short codes for QR links.
 *
 * Format examples:
 * - Profile slug: "marcel-djedje-x7k2m" (2 words + 5-char suffix)
 * - QR short code: "abc12345" (8 chars, alphanumeric)
 */

import { randomBytes } from 'crypto'

/**
 * Safe alphabet for short codes (excludes ambiguous characters: 0, O, 1, l, I)
 * Total: 57 characters (a-z, A-Z, 2-9 minus ambiguous)
 */
const SAFE_ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/**
 * Normalizes a string by removing accents and special characters
 *
 * @example
 * normalizeString("François Nguessan") → "francois nguessan"
 * normalizeString("Côte d'Ivoire") → "cote divoire"
 */
export function normalizeString(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .replace(/[^a-z0-9\s-]/g, '') // Keep only alphanumeric, spaces, hyphens
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
}

/**
 * Extracts the first N words from a string
 *
 * @example
 * extractWords("Jean Marc François Kouassi", 2) → "jean marc"
 */
export function extractWords(input: string, count: number): string {
  const words = normalizeString(input).split(' ').filter(Boolean)
  return words.slice(0, count).join(' ')
}

/**
 * Generates a cryptographically secure random string
 *
 * @param length - Length of the generated string
 * @param alphabet - Character set to use (defaults to SAFE_ALPHABET)
 * @returns Random string of specified length
 */
export function generateRandomString(length: number, alphabet: string = SAFE_ALPHABET): string {
  const bytes = randomBytes(length)
  let result = ''

  for (let i = 0; i < length; i++) {
    const byte = bytes[i]
    if (byte !== undefined) {
      result += alphabet[byte % alphabet.length]
    }
  }

  return result
}

/**
 * Generates a deterministic short suffix from a profileId
 *
 * @param profileId - The profile's unique ID (cuid)
 * @returns 5-character suffix derived from the ID
 *
 * @example
 * generateSuffixFromId("clxyz123abc") → "xyz12"
 */
export function generateSuffixFromId(profileId: string): string {
  // Take last 5 chars of profileId and convert to safe alphabet
  const lastChars = profileId.slice(-5).toLowerCase()
  let suffix = ''

  for (const char of lastChars) {
    const charCode = char.charCodeAt(0)
    const alphabetChar = SAFE_ALPHABET[charCode % SAFE_ALPHABET.length]
    if (alphabetChar) {
      suffix += alphabetChar
    }
  }

  return suffix
}

/**
 * Generates a short profile slug in format: "firstname-lastname-xxxxx"
 *
 * @param fullName - User's full name
 * @param profileId - Optional profile ID for deterministic suffix
 * @returns Short slug (e.g., "marcel-djedje-x7k2m")
 *
 * @example
 * generateProfileSlug("Marcel Djedje Kouassi") → "marcel-djedje-a3k2m"
 * generateProfileSlug("François N'Guessan", "clxyz123abc") → "francois-nguessan-xyz12"
 */
export function generateProfileSlug(fullName: string, profileId?: string): string {
  // Extract first 2 words
  const firstTwoWords = extractWords(fullName, 2)

  if (!firstTwoWords) {
    throw new Error('Full name must contain at least one valid word')
  }

  // Convert spaces to hyphens
  const baseSlug = firstTwoWords.replace(/\s+/g, '-')

  // Generate suffix (deterministic if profileId provided, otherwise random)
  const suffix = profileId
    ? generateSuffixFromId(profileId)
    : generateRandomString(5)

  return `${baseSlug}-${suffix}`
}

/**
 * Generates a secure short code for QR links
 *
 * @returns 8-character alphanumeric code (e.g., "abc12345")
 *
 * @example
 * generateQrShortCode() → "a3k2mB7x"
 *
 * @remarks
 * - 8 chars from 57-char alphabet = 57^8 = ~2.8 trillion combinations
 * - Excludes ambiguous characters (0/O, 1/l/I)
 * - Cryptographically secure (uses crypto.randomBytes)
 */
export function generateQrShortCode(): string {
  return generateRandomString(8)
}

/**
 * Validates profile slug format
 *
 * @param slug - Slug to validate
 * @returns true if slug matches format "word-word-xxxxx"
 *
 * @example
 * isValidSlugFormat("marcel-djedje-x7k2m") → true
 * isValidSlugFormat("marcel-djedje") → false (missing suffix)
 * isValidSlugFormat("marcel_djedje-x7k2m") → false (underscore not allowed)
 */
export function isValidSlugFormat(slug: string): boolean {
  // Pattern: 1-2 words (lowercase alphanumeric + hyphens) + 5-char suffix
  // Examples: "marcel-x7k2m", "jean-marc-abc12", "kouassi-xyz99"
  const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*-[a-z0-9]{5}$/i

  return slugPattern.test(slug)
}

/**
 * Validates QR short code format
 *
 * @param shortCode - Short code to validate
 * @returns true if short code is exactly 8 alphanumeric characters
 *
 * @example
 * isValidQrShortCode("abc12345") → true
 * isValidQrShortCode("abc123") → false (too short)
 * isValidQrShortCode("abc123@5") → false (invalid character)
 */
export function isValidQrShortCode(shortCode: string): boolean {
  // Exactly 8 alphanumeric characters (case-insensitive)
  const shortCodePattern = /^[a-z0-9]{8}$/i

  return shortCodePattern.test(shortCode)
}
