/**
 * GeoIP and IP Anonymization Utilities
 *
 * This module provides RGPD-compliant visitor tracking:
 * - Fetches city/country from IP using ipapi.co (free tier: 30k requests/month)
 * - Hashes IP addresses using SHA-256 (never stores actual IPs)
 * - No personal data collection (only geographic location)
 *
 * Privacy Notes:
 * - IP addresses are hashed before storage (SHA-256)
 * - Only city/country/region are stored (no precise addresses)
 * - No PII (names, emails, etc.) is collected
 * - Complies with GDPR/RGPD requirements for anonymous analytics
 */

/**
 * GeoIP data structure returned from ipapi.co
 */
export interface GeoIPData {
  city: string | null
  country: string | null
  countryCode: string | null // ISO 2-letter code (CI, FR, US, etc.)
  region: string | null
}

/**
 * Fetch geographic location data from an IP address
 *
 * Uses ipapi.co free tier API (30,000 requests/month, no API key required)
 * API Documentation: https://ipapi.co/api/
 *
 * @param ip - The IP address to lookup (IPv4 or IPv6)
 * @returns GeoIP data with city, country, and region
 *
 * @example
 * ```typescript
 * const geoData = await getGeoIPData('8.8.8.8')
 * console.log(geoData)
 * // {
 * //   city: 'Mountain View',
 * //   country: 'United States',
 * //   countryCode: 'US',
 * //   region: 'California'
 * // }
 * ```
 *
 * @throws Does not throw - returns null values on error
 */
export async function getGeoIPData(ip: string): Promise<GeoIPData> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'SmartLink/1.0',
      },
      // Cache results for 24 hours to reduce API calls
      next: { revalidate: 86400 },
    })

    if (!response.ok) {
      console.error(`GeoIP API error: ${response.status}`)
      throw new Error('GeoIP API request failed')
    }

    const data = await response.json()

    // ipapi.co returns 'undefined' string for unknown values
    return {
      city: data.city && data.city !== 'undefined' ? data.city : null,
      country: data.country_name && data.country_name !== 'undefined' ? data.country_name : null,
      countryCode: data.country_code && data.country_code !== 'undefined' ? data.country_code : null,
      region: data.region && data.region !== 'undefined' ? data.region : null,
    }
  } catch (error) {
    console.error('GeoIP lookup failed:', error)
    return {
      city: null,
      country: null,
      countryCode: null,
      region: null,
    }
  }
}

/**
 * Hash an IP address using SHA-256 for anonymous storage
 *
 * RGPD Compliance:
 * - Stores hash instead of actual IP address
 * - Makes visitor tracking anonymous
 * - Allows deduplication without storing personal data
 *
 * @param ip - The IP address to hash
 * @returns SHA-256 hash as hexadecimal string
 *
 * @example
 * ```typescript
 * const ipHash = await hashIP('192.168.1.1')
 * console.log(ipHash)
 * // "c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646"
 * ```
 */
export async function hashIP(ip: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(ip)
    const buffer = await crypto.subtle.digest('SHA-256', data)

    // Convert ArrayBuffer to hex string
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  } catch (error) {
    console.error('IP hashing failed:', error)
    // Return a fallback hash to prevent tracking errors
    return 'unknown'
  }
}

/**
 * Hash a User-Agent string for browser fingerprinting
 *
 * Used alongside IP hash for more accurate visitor deduplication
 * Example: Same IP but different devices = different visitors
 *
 * @param userAgent - The User-Agent string from HTTP headers
 * @returns SHA-256 hash as hexadecimal string
 *
 * @example
 * ```typescript
 * const uaHash = await hashUserAgent('Mozilla/5.0...')
 * ```
 */
export async function hashUserAgent(userAgent: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(userAgent)
    const buffer = await crypto.subtle.digest('SHA-256', data)

    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  } catch (error) {
    console.error('User-Agent hashing failed:', error)
    return 'unknown'
  }
}

/**
 * Get the client's IP address from Next.js request headers
 *
 * Handles various reverse proxy headers:
 * - x-forwarded-for (most common, used by Vercel)
 * - x-real-ip (nginx)
 * - Fallback to '0.0.0.0' if unavailable
 *
 * @param headers - Next.js headers() object
 * @returns The client's IP address
 *
 * @example
 * ```typescript
 * import { headers } from 'next/headers'
 *
 * const headersList = await headers()
 * const ip = getClientIP(headersList)
 * ```
 */
export function getClientIP(headers: Headers): string {
  // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
  // We want the first one (the actual client)
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback (should never happen in production)
  return '0.0.0.0'
}

/**
 * Rate limiting check for GeoIP API calls
 *
 * ipapi.co free tier: 30,000 requests/month (~1000/day)
 * This function helps monitor usage to avoid hitting limits
 *
 * @param currentMonthlyCount - Number of API calls this month
 * @returns true if safe to make another call, false if approaching limit
 */
export function canMakeGeoIPRequest(currentMonthlyCount: number): boolean {
  const FREE_TIER_LIMIT = 30000
  const SAFETY_BUFFER = 1000 // Leave 1k requests as buffer

  return currentMonthlyCount < FREE_TIER_LIMIT - SAFETY_BUFFER
}
