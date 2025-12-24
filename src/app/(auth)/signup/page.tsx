'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { signUp } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setIsLoading(true)

    try {
      await signUp.email({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      if (err?.message?.includes('already exists')) {
        setError('Un compte existe déjà avec cet email')
      } else {
        setError('Erreur lors de la création du compte')
      }
      console.error('Signup error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">SmartLink</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Créez votre compte gratuitement
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inscription</CardTitle>
            <CardDescription>
              Créez un compte pour commencer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Field>
                <FieldLabel htmlFor="name">Nom complet</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jean Kouassi"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jean@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  disabled={isLoading}
                />
                <FieldDescription>Minimum 8 caractères</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">Confirmer le mot de passe</FieldLabel>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  disabled={isLoading}
                />
              </Field>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Création...' : 'Créer mon compte'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                En créant un compte, vous acceptez nos Conditions d'utilisation
              </p>

              <p className="text-center text-sm text-muted-foreground">
                Vous avez déjà un compte ?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Se connecter
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
