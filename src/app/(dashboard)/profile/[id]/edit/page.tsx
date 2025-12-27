'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2 } from 'lucide-react'
import { ProfileUpdateSchema, type ProfileInput } from '@/lib/validations/profile'
import { updateProfileAction, getProfileById } from '@/lib/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
import { Skeleton } from '@/components/ui/skeleton'
import { CVUpload } from '@/components/profile/cv-upload'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { VideoUpload } from '@/components/profile/video-upload'
import { Separator } from '@/components/ui/separator'
import { canAccessFeature } from '@/lib/utils/tier-enforcement'
import { Video } from 'lucide-react'
import { SubscriptionPlan } from '@prisma/client'
import Link from 'next/link'

export default function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params Promise (Next.js 16+)
  const { id: profileId } = use(params)

  const router = useRouter()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [cvUrl, setCvUrl] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<SubscriptionPlan>('FREE')

  const form = useForm({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues: {
      label: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      jobTitle: '',
      company: '',
      website: '',
      linkedinUrl: '',
      twitterUrl: '',
      facebookUrl: '',
      whatsappNumber: '',
      isPublic: true,
      showCV: true,
    },
  })

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getProfileById(profileId)
        form.reset({
          label: profile.label || '',
          fullName: profile.fullName,
          email: profile.email,
          phoneNumber: profile.phoneNumber,
          jobTitle: profile.jobTitle || '',
          company: profile.company || '',
          website: profile.website || '',
          linkedinUrl: profile.linkedinUrl || '',
          twitterUrl: profile.twitterUrl || '',
          facebookUrl: profile.facebookUrl || '',
          whatsappNumber: profile.whatsappNumber || '',
          isPublic: profile.isPublic,
          showCV: profile.showCV,
        })
        setCvUrl(profile.cvFileUrl)
        setAvatarUrl(profile.avatarUrl)
        setVideoUrl(profile.videoUrl)
        setUserPlan(profile.user.subscription?.plan || 'FREE')
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement du profil')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [profileId, form])

  async function onSubmit(data: any) {
    setError('')

    try {
      const result = await updateProfileAction({
        profileId: profileId,
        data: data as Partial<ProfileInput>,
      })

      if (result?.data?.success) {
        router.push(`/profile/${profileId}/preview`)
        router.refresh()
      } else {
        setError(result?.serverError || 'Une erreur est survenue')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du profil')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-2 h-5 w-96" />
        </div>
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="mt-2 h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Modifier le profil</h1>
        <p className="mt-2 text-muted-foreground">
          Mettez à jour les informations de votre profil SmartLink
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Informations du profil</CardTitle>
            <CardDescription>
              Les champs marqués d'un astérisque (*) sont obligatoires
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Section Informations de base */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Informations de base</h3>

                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du profil *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Professionnel, Artistique, Personnel..." {...field} />
                        </FormControl>
                        <FormDescription>
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
                        <FormLabel>Nom complet *</FormLabel>
                        <FormControl>
                          <Input placeholder="Jean Kouassi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poste</FormLabel>
                        <FormControl>
                          <Input placeholder="Développeur Full-Stack" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entreprise</FormLabel>
                        <FormControl>
                          <Input placeholder="Mon Entreprise SARL" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Section Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Coordonnées</h3>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jean@example.com" {...field} />
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
                        <FormLabel>Téléphone *</FormLabel>
                        <FormControl>
                          <Input placeholder="+2250708413484" {...field} />
                        </FormControl>
                        <FormDescription>
                          Format E.164 requis (ex: +2250708413484)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input placeholder="+2250708413484" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site web</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Section Réseaux sociaux */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Réseaux sociaux</h3>

                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn</FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/in/username" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitterUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter / X</FormLabel>
                        <FormControl>
                          <Input placeholder="https://x.com/username" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="facebookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
                        <FormControl>
                          <Input placeholder="https://facebook.com/username" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Section Paramètres */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Paramètres</h3>

                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Profil public</FormLabel>
                          <FormDescription>
                            Rendre ce profil accessible via son lien unique
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showCV"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Afficher le CV</FormLabel>
                          <FormDescription>
                            Permettre le téléchargement du CV sur le profil public
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Section Photo de profil */}
                <Separator />
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Photo de profil</h3>
                    <p className="text-sm text-muted-foreground">
                      Ajoutez une photo pour personnaliser votre profil
                    </p>
                  </div>
                  <AvatarUpload
                    profileId={profileId}
                    currentAvatarUrl={avatarUrl}
                    onUploadSuccess={(url) => setAvatarUrl(url)}
                    onDeleteSuccess={() => setAvatarUrl(null)}
                  />
                </div>

                {/* Section CV */}
                <Separator />
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Curriculum Vitae</h3>
                    <p className="text-sm text-muted-foreground">
                      Téléchargez votre CV pour le rendre disponible sur votre profil public
                    </p>
                  </div>
                  <CVUpload
                    profileId={profileId}
                    currentCvUrl={cvUrl}
                    onUploadSuccess={(url) => setCvUrl(url)}
                    onDeleteSuccess={() => setCvUrl(null)}
                  />
                </div>

                {/* Section Vidéo Business Card (PRO+ only) */}
                <Separator />
                {!canAccessFeature(userPlan, 'video') ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">Carte de Visite Vidéo</h3>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          PRO+
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Disponible avec le plan PRO ou supérieur
                      </p>
                    </div>
                    <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 p-8">
                      {/* Blur overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm z-10" />

                      {/* Content */}
                      <div className="relative z-0 flex flex-col items-center gap-4 text-center">
                        <div className="rounded-full bg-primary/10 p-4">
                          <Video className="h-12 w-12 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-lg">Démarquez-vous avec une vidéo</p>
                          <p className="text-sm text-muted-foreground max-w-md">
                            Présentez-vous en 30 secondes et créez un impact immédiat. Vidéo autoplay sur votre profil public.
                          </p>
                        </div>
                        <div className="relative z-20">
                          <Button asChild className="cursor-pointer bg-primary hover:bg-primary/90">
                            <Link href="/dashboard/upgrade">
                              Passer au PRO
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">Carte de Visite Vidéo</h3>
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                          PRO
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Téléchargez une vidéo de 30 secondes maximum pour vous présenter
                      </p>
                    </div>
                    <VideoUpload
                      profileId={profileId}
                      currentVideoUrl={videoUrl}
                      onUploadSuccess={(url) => setVideoUrl(url)}
                      onDeleteSuccess={() => setVideoUrl(null)}
                    />
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    asChild
                    className="flex-1 cursor-pointer border-border hover:bg-muted"
                  >
                    <Link href={`/profile/${profileId}/preview`}>Annuler</Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="flex-1 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mise à jour...
                      </>
                    ) : (
                      'Mettre à jour'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
