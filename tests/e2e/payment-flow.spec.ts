import { test, expect } from '@playwright/test'

/**
 * E2E Test: Payment Flow with Lemon Squeezy
 *
 * Tests critiques pour le système de paiement :
 * - Affichage des 3 produits
 * - Sélection de produit
 * - Redirection vers Lemon Squeezy
 * - Prix corrects
 */

test.describe('Payment Flow - Lemon Squeezy', () => {
  test('should display 3 product options with correct prices', async ({ page }) => {
    await page.goto('/dashboard/upgrade')

    // Vérifier que les 3 produits s'affichent
    await expect(page.locator('text=Pro Monthly')).toBeVisible()
    await expect(page.locator('text=Pro Yearly')).toBeVisible()
    await expect(page.locator('text=Pack Starter')).toBeVisible()

    // Vérifier les prix corrects
    await expect(page.locator('text=3 000')).toBeVisible() // Pro Monthly
    await expect(page.locator('text=30 000')).toBeVisible() // Pro Yearly
    await expect(page.locator('text=29 900')).toBeVisible() // Pack Starter
  })

  test('should show "Économie" badge on Pro Yearly', async ({ page }) => {
    await page.goto('/dashboard/upgrade')

    // Le badge économie doit être visible sur Pro Yearly
    const yearlyCard = page.locator('[data-product-id="PRO_YEARLY"]')
    await expect(yearlyCard).toBeVisible()

    // Vérifier le badge (texte "Économie" OU "20%")
    const hasBadge =
      (await yearlyCard.locator('text=/Économie|20%/').count()) > 0

    expect(hasBadge).toBeTruthy()
  })

  test('should update CTA price when selecting different products', async ({ page }) => {
    await page.goto('/dashboard/upgrade')

    // Sélectionner Pro Monthly
    const monthlyCard = page.locator('[data-product-id="PRO_MONTHLY"]')
    await monthlyCard.click()

    // Le bouton doit afficher 3 000 FCFA
    const ctaButton = page.locator('button:has-text("Payer")')
    await expect(ctaButton).toContainText('3 000')

    // Sélectionner Pro Yearly
    const yearlyCard = page.locator('[data-product-id="PRO_YEARLY"]')
    await yearlyCard.click()

    // Le bouton doit afficher 30 000 FCFA
    await expect(ctaButton).toContainText('30 000')

    // Sélectionner Pack Starter
    const starterCard = page.locator('[data-product-id="PACK_STARTER"]')
    await starterCard.click()

    // Le bouton doit afficher 29 900 FCFA
    await expect(ctaButton).toContainText('29 900')
  })

  test('should show card payment method as available', async ({ page }) => {
    await page.goto('/dashboard/upgrade')

    // La carte bancaire doit être disponible (pas grisée)
    const cardMethod = page.locator('[data-payment-method="card"]')
    await expect(cardMethod).toBeVisible()

    // Vérifier qu'elle n'a PAS de classe opacity-50 (pas grisée)
    const isDisabled = await cardMethod.evaluate((el) =>
      el.classList.contains('opacity-50')
    )
    expect(isDisabled).toBe(false)
  })

  test('should redirect to Lemon Squeezy checkout on payment button click', async ({
    page,
  }) => {
    await page.goto('/dashboard/upgrade')

    // Sélectionner Pro Yearly
    const yearlyCard = page.locator('[data-product-id="PRO_YEARLY"]')
    await yearlyCard.click()

    // Cliquer sur le bouton de paiement
    const ctaButton = page.locator('button:has-text("Payer")')

    // Attendre la navigation (peut être lente en test)
    const [newPage] = await Promise.all([
      page.waitForEvent('popup', { timeout: 10000 }).catch(() => null), // Popup si nouvelle fenêtre
      ctaButton.click(),
    ])

    // Si nouvelle fenêtre (popup)
    if (newPage) {
      await newPage.waitForLoadState('networkidle')
      expect(newPage.url()).toContain('lemonsqueezy.com')
      await newPage.close()
    } else {
      // Si redirection dans la même page
      await page.waitForURL(/lemonsqueezy\.com/, { timeout: 10000 })
      expect(page.url()).toContain('lemonsqueezy.com')
    }
  })

  test('should show features list for each product', async ({ page }) => {
    await page.goto('/dashboard/upgrade')

    // Pro Monthly features
    const monthlyCard = page.locator('[data-product-id="PRO_MONTHLY"]')
    await expect(monthlyCard.locator('text=3 profils personnalisés')).toBeVisible()
    await expect(monthlyCard.locator('text=QR codes dynamiques')).toBeVisible()

    // Pro Yearly features (inclut économie)
    const yearlyCard = page.locator('[data-product-id="PRO_YEARLY"]')
    await expect(yearlyCard.locator('text=3 profils personnalisés')).toBeVisible()
    await expect(yearlyCard.locator('text=/Économisez|6 000/i')).toBeVisible()

    // Pack Starter features (inclut cartes papier)
    const starterCard = page.locator('[data-product-id="PACK_STARTER"]')
    await expect(starterCard.locator('text=50 cartes papier')).toBeVisible()
  })
})
