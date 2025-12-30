import { test, expect } from '@playwright/test'

/**
 * E2E Test: Mobile Money "Coming Soon" UI
 *
 * Vérifie que l'UI Mobile Money est correctement affichée comme "Bientôt disponible"
 * - Badge "Bientôt"
 * - Bouton grisé (disabled)
 * - Message explicatif
 * - Bouton Carte bancaire actif (contraste)
 */

test.describe('Mobile Money UI - Coming Soon', () => {
  test('should show Mobile Money as "Coming Soon" (grayed out)', async ({ page }) => {
    await page.goto('/dashboard/upgrade')

    // Le bouton Mobile Money doit exister
    const mobileMoneyCard = page.locator('[data-payment-method="mobile_money"]')
    await expect(mobileMoneyCard).toBeVisible()

    // Vérifier qu'il est grisé (opacity-50)
    const hasOpacity = await mobileMoneyCard.evaluate((el) =>
      el.classList.contains('opacity-50')
    )
    expect(hasOpacity).toBe(true)

    // Vérifier qu'il est disabled (cursor-not-allowed)
    const isDisabled = await mobileMoneyCard.evaluate((el) =>
      el.classList.contains('cursor-not-allowed')
    )
    expect(isDisabled).toBe(true)
  })

  test('should display "Bientôt" badge on Mobile Money', async ({ page }) => {
    await page.goto('/dashboard/upgrade')

    const mobileMoneyCard = page.locator('[data-payment-method="mobile_money"]')

    // Le badge "Bientôt" doit être visible
    const badge = mobileMoneyCard.locator('text=Bientôt')
    await expect(badge).toBeVisible()
  })

  test('should show explanatory message for Mobile Money unavailability', async ({ page }) => {
    await page.goto('/dashboard/upgrade')

    const mobileMoneyCard = page.locator('[data-payment-method="mobile_money"]')

    // Message explicatif doit être présent
    await expect(
      mobileMoneyCard.locator('text=/disponible|prochainement/i')
    ).toBeVisible()
  })

  test('should list Mobile Money providers (Orange, MTN, Moov, Wave)', async ({ page }) => {
    await page.goto('/dashboard/upgrade')

    const mobileMoneyCard = page.locator('[data-payment-method="mobile_money"]')

    // Vérifier mention des providers (au moins un)
    const hasProviders =
      (await mobileMoneyCard.locator('text=/Orange|MTN|Moov|Wave/i').count()) > 0

    expect(hasProviders).toBeTruthy()
  })

  test('should NOT be clickable (disabled state)', async ({ page }) => {
    await page.goto('/dashboard/upgrade')

    const mobileMoneyCard = page.locator('[data-payment-method="mobile_money"]')

    // Essayer de cliquer (ne devrait rien faire)
    await mobileMoneyCard.click({ force: true })

    // Vérifier qu'on est toujours sur la page upgrade (pas de redirection)
    await expect(page).toHaveURL(/\/dashboard\/upgrade/)
  })

  test('should contrast with active card payment method', async ({ page }) => {
    await page.goto('/dashboard/upgrade')

    const cardMethod = page.locator('[data-payment-method="card"]')
    const mobileMoneyMethod = page.locator('[data-payment-method="mobile_money"]')

    // Carte bancaire : active (pas grisée)
    const cardDisabled = await cardMethod.evaluate((el) =>
      el.classList.contains('opacity-50')
    )
    expect(cardDisabled).toBe(false)

    // Mobile Money : grisée
    const mobileDisabled = await mobileMoneyMethod.evaluate((el) =>
      el.classList.contains('opacity-50')
    )
    expect(mobileDisabled).toBe(true)

    // Contraste visuel clair
    expect(cardDisabled).not.toBe(mobileDisabled)
  })

  test('should show Mobile Money icon', async ({ page }) => {
    await page.goto('/dashboard/upgrade')

    const mobileMoneyCard = page.locator('[data-payment-method="mobile_money"]')

    // Icône Mobile Money (SVG ou emoji 📱)
    const hasIcon =
      (await mobileMoneyCard.locator('svg').count()) > 0 ||
      (await mobileMoneyCard.locator('text=📱').count()) > 0

    expect(hasIcon).toBeTruthy()
  })
})
