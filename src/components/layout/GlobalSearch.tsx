'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Raccourci Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const navigateTo = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 px-3 py-2 text-sm bg-muted/50 rounded-md hover:bg-muted transition-colors w-full"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Rechercher...</span>
        <kbd className="ml-auto pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Rechercher profils, navigation..." />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => navigateTo('/dashboard')}>
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/profiles')}>
              Mes Profils
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/profile/create')}>
              Créer un Profil
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/dashboard/settings')}>
              Paramètres
            </CommandItem>
          </CommandGroup>

          {/* TODO: Ajouter recherche dynamique de profils */}
        </CommandList>
      </CommandDialog>
    </>
  )
}
