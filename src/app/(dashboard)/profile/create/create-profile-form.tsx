'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2, Sparkles, Info } from 'lucide-react'
import { z } from 'zod'
import { createProfileAction } from '@/lib/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import Link from 'next/link'
import { useState } from 'react'

// Schéma minimal pour la création (le reste sera ajouté dans la preview)
const MinimalProfileSchema = z.object({
  label: z
    .string()
    .min(2, 'Le nom du profil doit contenir au moins 2 caractères')
    .max(50, 'Le nom du profil ne peut pas dépasser 50 caractères'),
  fullName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z.string().email('Email invalide'),
  phoneNumber: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      'Format E.164 requis (ex: +2250708413484)'
    ),
})

type MinimalProfileInput = z.infer<typeof MinimalProfileSchema>

export default function CreateProfileForm() {
  const router = useRouter()
  const [error, setError] = useState('')

  const form = useForm({
    resolver: zodResolver(MinimalProfileSchema),
    defaultValues: {
      label: '',
      fullName: '',
      email: '',
      phoneNumber: '',
    },
  })

  async function onSubmit(data: MinimalProfileInput) {
    setError('')

    try {
      // Add default values for optional fields
      const profileData = {
        ...data,
        jobTitle: '',
        company: '',
        website: '',
        linkedinUrl: '',
        twitterUrl: '',
        facebookUrl: '',
        whatsappNumber: '',
        isPublic: true,
        showCV: true,
      }

      const result = await createProfileAction(profileData as any)

      if (result?.data?.success) {
        // Redirect to preview page instead of dashboard
        const profileId = result.data.profile?.id
        if (profileId) {
          router.push(`/profile/${profileId}/preview`)
        } else {
          router.push('/dashboard/profiles')
        }
        router.refresh()
      } else {
        setError(result?.serverError || 'Une erreur est survenue')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du profil')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Créer un nouveau profil
        </h1>
        <p className="mt-2 text-base text-muted-foreground max-w-xl mx-auto">
          Commencez avec les informations essentielles. Vous pourrez ajouter le reste (expériences, compétences, CV) dans l'étape suivante.
        </p>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Informations de base</CardTitle>
          <CardDescription>
            Seulement 4 champs requis pour commencer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-foreground/80">
                  <strong className="text-primary">Astuce :</strong> Le nom du profil vous aide à différencier vos profils (ex: "Professionnel", "Artistique", "Freelance").
                </AlertDescription>
              </Alert>

              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">
                        Nom du profil *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Professionnel, Artistique, Personnel..."
                          className="border-border bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-muted-foreground">
                        Ce nom vous aide à organiser vos profils
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">
                        Votre nom complet *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jean Kouassi"
                          className="border-border bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-muted-foreground">
                        Nom qui apparaîtra sur votre profil public
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">
                        Email professionnel *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="jean@example.com"
                          className="border-border bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">
                        Numéro de téléphone *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+2250708413484"
                          className="border-border bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-muted-foreground">
                        Format international (commencez par +)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="w-full sm:flex-1 cursor-pointer border-border hover:bg-muted"
                >
                  <Link href="/dashboard/profiles">Annuler</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full sm:flex-1 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Continuer vers la personnalisation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-6 rounded-lg bg-muted/50 border border-border p-4 text-center">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Prochaine étape :</strong> Ajoutez vos expériences, compétences, CV et personnalisez votre profil
        </p>
      </div>
    </div>
  )
}
