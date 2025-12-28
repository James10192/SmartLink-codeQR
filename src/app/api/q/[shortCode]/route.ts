/**
 * QR Short Link Redirect Handler
 *
 * Dynamic QR code endpoint: /q/[shortCode]
 * Redirects to profile page if QR code is active
 * Shows expiration page if subscription expired
 */

import { NextRequest, NextResponse } from 'next/server'
import { getActiveQrLink } from '@/lib/actions/qr-link'
import { isValidQrShortCode } from '@/lib/utils/slug'

/**
 * GET /api/q/[shortCode]
 *
 * Handles QR code scans and redirects to profile page
 *
 * Flow:
 * 1. Validate short code format
 * 2. Lookup QR link in database
 * 3. Check if active (subscription valid)
 * 4. Redirect to profile or show expiration page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params

  // Validate short code format
  if (!isValidQrShortCode(shortCode)) {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>QR Code Invalide - SmartLink</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #fff;
            }
            .container {
              text-align: center;
              padding: 2rem;
              max-width: 500px;
            }
            h1 {
              font-size: 3rem;
              margin: 0 0 1rem 0;
            }
            p {
              font-size: 1.25rem;
              margin: 0 0 2rem 0;
              opacity: 0.9;
            }
            a {
              display: inline-block;
              padding: 0.75rem 1.5rem;
              background: #fff;
              color: #667eea;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              transition: transform 0.2s;
            }
            a:hover {
              transform: scale(1.05);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌</h1>
            <p>Code QR invalide</p>
            <a href="/">Retour à l'accueil</a>
          </div>
        </body>
      </html>
      `,
      {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  // Get active QR link (with analytics tracking)
  const qrLink = await getActiveQrLink(shortCode)

  // QR link not found or inactive
  if (!qrLink) {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>QR Code Expiré - SmartLink</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: #fff;
            }
            .container {
              text-align: center;
              padding: 2rem;
              max-width: 600px;
            }
            h1 {
              font-size: 3rem;
              margin: 0 0 1rem 0;
            }
            .title {
              font-size: 2rem;
              margin: 0 0 1rem 0;
              font-weight: 700;
            }
            p {
              font-size: 1.125rem;
              margin: 0 0 2rem 0;
              opacity: 0.95;
              line-height: 1.6;
            }
            .cta {
              display: inline-block;
              padding: 1rem 2rem;
              background: #fff;
              color: #f5576c;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 700;
              font-size: 1.125rem;
              transition: transform 0.2s, box-shadow 0.2s;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }
            .cta:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 30px rgba(0, 0, 0, 0.2);
            }
            .secondary {
              margin-top: 1rem;
              display: block;
              color: #fff;
              text-decoration: underline;
              opacity: 0.8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⏱️</h1>
            <div class="title">QR Code Expiré</div>
            <p>
              Ce QR code n'est plus actif car l'abonnement du propriétaire a expiré.<br>
              <strong>Bonne nouvelle :</strong> Si le propriétaire renouvelle son abonnement dans les 30 jours, ce QR code redeviendra automatiquement actif !
            </p>
            <a href="/" class="cta">Créer mon SmartLink</a>
            <a href="/pricing" class="secondary">Voir les tarifs</a>
          </div>
        </body>
      </html>
      `,
      {
        status: 410, // 410 Gone - Resource no longer available
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  // QR link active - redirect to profile
  const profileUrl = `/u/${qrLink.profile.slug}`

  // 301 Permanent Redirect (good for SEO, cached by browsers)
  return NextResponse.redirect(new URL(profileUrl, request.url), 301)
}
