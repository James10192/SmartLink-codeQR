'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { signIn, signUp } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { OAuthButtons } from '@/components/auth/oauth-buttons'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: 'login' | 'signup'
}

export function AuthModal({ open, onOpenChange, defaultTab = 'login' }: AuthModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab)

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoginLoading, setIsLoginLoading] = useState(false)

  // Signup state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [signupError, setSignupError] = useState('')
  const [isSignupLoading, setIsSignupLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    setIsLoginLoading(true)

    try {
      await signIn.email({
        email: loginEmail,
        password: loginPassword,
      })

      onOpenChange(false)
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setLoginError('Email ou mot de passe incorrect')
      console.error('Login error:', err)
    } finally {
      setIsLoginLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setSignupError('')

    if (signupData.password !== signupData.confirmPassword) {
      setSignupError('Les mots de passe ne correspondent pas')
      return
    }

    if (signupData.password.length < 8) {
      setSignupError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setIsSignupLoading(true)

    try {
      await signUp.email({
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
      })

      onOpenChange(false)
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : ''

      if (errorMessage.includes('already exists')) {
        setSignupError('Un compte existe déjà avec cet email')
      } else {
        setSignupError('Erreur lors de la création du compte')
      }
      console.error('Signup error:', err)
    } finally {
      setIsSignupLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-zinc-950 border-zinc-800 max-h-[95vh]">
        <DialogHeader className="flex flex-col items-center space-y-3 sm:space-y-4">
          <Image
            src="/logo.png"
            alt="SmartLink Logo"
            width={80}
            height={80}
            className="rounded-lg w-16 h-16 sm:w-20 sm:h-20"
            priority
          />
          <DialogTitle className="text-xl sm:text-2xl">
            {activeTab === 'login' ? 'Connexion' : 'Créer un compte'}
          </DialogTitle>
          <DialogDescription>
            {activeTab === 'login'
              ? 'Connectez-vous pour accéder à votre espace'
              : 'Rejoignez SmartLink gratuitement'}
          </DialogDescription>
        </DialogHeader>

        {/* Animated Toggle */}
        <div className="relative flex gap-0 p-1 bg-zinc-800/50 rounded-lg">
          {/* Sliding background indicator */}
          <motion.div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/90 rounded-md shadow-lg"
            initial={false}
            animate={{
              left: activeTab === 'login' ? '4px' : 'calc(50% + 0px)',
            }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 35,
            }}
          />

          {/* Toggle buttons */}
          <button
            onClick={() => setActiveTab('login')}
            className={`relative z-10 flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'login'
                ? 'text-black'
                : 'text-white/60 hover:text-white/90'
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`relative z-10 flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'signup'
                ? 'text-black'
                : 'text-white/60 hover:text-white/90'
            }`}
          >
            Inscription
          </button>
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            <Field>
              <FieldLabel htmlFor="login-email">Email</FieldLabel>
              <Input
                id="login-email"
                type="email"
                placeholder="jean@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                disabled={isLoginLoading}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="login-password">Mot de passe</FieldLabel>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                minLength={8}
                disabled={isLoginLoading}
              />
            </Field>

            <Button type="submit" className="w-full" disabled={isLoginLoading}>
              {isLoginLoading ? 'Connexion...' : 'Se connecter'}
            </Button>

            <OAuthButtons />
          </form>
        )}

        {/* Signup Form */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            {signupError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{signupError}</AlertDescription>
              </Alert>
            )}

            <Field>
              <FieldLabel htmlFor="signup-name">Nom complet</FieldLabel>
              <Input
                id="signup-name"
                type="text"
                placeholder="Jean Kouassi"
                value={signupData.name}
                onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                required
                disabled={isSignupLoading}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="signup-email">Email</FieldLabel>
              <Input
                id="signup-email"
                type="email"
                placeholder="jean@example.com"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                required
                disabled={isSignupLoading}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="signup-password">Mot de passe</FieldLabel>
              <Input
                id="signup-password"
                type="password"
                placeholder="••••••••"
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                required
                minLength={8}
                disabled={isSignupLoading}
              />
              <FieldDescription>Minimum 8 caractères</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="signup-confirm">Confirmer le mot de passe</FieldLabel>
              <Input
                id="signup-confirm"
                type="password"
                placeholder="••••••••"
                value={signupData.confirmPassword}
                onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                required
                minLength={8}
                disabled={isSignupLoading}
              />
            </Field>

            <Button type="submit" className="w-full" disabled={isSignupLoading}>
              {isSignupLoading ? 'Création...' : 'Créer mon compte'}
            </Button>

            <OAuthButtons />

            <p className="text-xs text-center text-muted-foreground">
              En créant un compte, vous acceptez nos Conditions d'utilisation
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
