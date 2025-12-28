import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getSession } from '@/lib/auth/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Calendar, Edit, KeyRound } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Paramètres',
  description: 'Gérez votre compte et vos préférences',
}

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const initials = session.user.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : session.user.email.charAt(0).toUpperCase()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="mt-2 text-muted-foreground">
          Gérez vos informations personnelles et préférences
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Informations du compte */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
            <CardDescription>
              Vos informations personnelles et détails du compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={session.user.image || undefined} alt={session.user.name || 'User'} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {session.user.name || 'Utilisateur'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {session.user.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Membre depuis {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Statut de vérification</h3>
              <div className="flex items-center gap-2">
                <Badge variant={session.user.emailVerified ? 'default' : 'secondary'}>
                  {session.user.emailVerified ? 'Email vérifié' : 'Email non vérifié'}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" disabled className="w-full sm:w-auto">
                <Edit className="h-4 w-4 mr-2" />
                Modifier le profil
              </Button>
              <Button variant="outline" disabled className="w-full sm:w-auto">
                <KeyRound className="h-4 w-4 mr-2" />
                Changer le mot de passe
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Abonnement */}
        <Card>
          <CardHeader>
            <CardTitle>Abonnement</CardTitle>
            <CardDescription>
              Gérez votre plan et votre facturation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Plan actuel</p>
                  <p className="text-sm text-muted-foreground">
                    Vous êtes actuellement sur le plan gratuit
                  </p>
                </div>
                <Badge variant="outline">FREE</Badge>
              </div>

              <Separator />

              <Button variant="default" disabled>
                Mettre à niveau
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Préférences */}
        <Card>
          <CardHeader>
            <CardTitle>Préférences</CardTitle>
            <CardDescription>
              Personnalisez votre expérience SmartLink
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifications par email</p>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des emails sur l'activité de vos profils
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Configurer
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Langue</p>
                  <p className="text-sm text-muted-foreground">
                    Français (France)
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Changer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zone de danger */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Zone de danger</CardTitle>
            <CardDescription>
              Actions irréversibles sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Supprimer le compte</p>
                  <p className="text-sm text-muted-foreground">
                    Supprimer définitivement votre compte et toutes vos données
                  </p>
                </div>
                <Button variant="destructive" size="sm" disabled>
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
