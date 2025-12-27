'use client'

import { useEffect, useRef } from 'react'

interface ViewTrackerProps {
  profileId: string
}

/**
 * Composant client pour tracker automatiquement les vues uniques de profil
 * Se déclenche une seule fois au montage du composant
 */
export function ViewTracker({ profileId }: ViewTrackerProps) {
  const hasTracked = useRef(false)

  useEffect(() => {
    // Éviter les double appels en strict mode (dev)
    if (hasTracked.current) return
    hasTracked.current = true

    // Tracker la vue de manière asynchrone
    const trackView = async () => {
      try {
        await fetch('/api/profile/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId }),
        })
      } catch (error) {
        // Silent fail - ne pas perturber l'expérience utilisateur
        console.error('View tracking failed:', error)
      }
    }

    trackView()
  }, [profileId])

  // Composant invisible (ne rend rien)
  return null
}
