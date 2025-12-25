'use client'

import React, { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { sendContactEmail, type ContactFormState } from '@/lib/actions/contact'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

const initialState: ContactFormState = {
  success: false,
}

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(sendContactEmail, initialState)

  return (
    <form action={formAction} className="w-full space-y-4">
      {state.message && (
        <Alert variant={state.success ? 'default' : 'destructive'}>
          {state.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Jean Kouassi"
          required
          disabled={isPending}
        />
        {state.errors?.name && (
          <p className="text-sm text-destructive">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="jean@example.com"
          required
          disabled={isPending}
        />
        {state.errors?.email && (
          <p className="text-sm text-destructive">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="subject">Sujet</Label>
        <Input
          id="subject"
          name="subject"
          type="text"
          placeholder="Demande d'information"
          required
          disabled={isPending}
        />
        {state.errors?.subject && (
          <p className="text-sm text-destructive">{state.errors.subject[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Votre message..."
          rows={4}
          required
          disabled={isPending}
        />
        {state.errors?.message && (
          <p className="text-sm text-destructive">{state.errors.message[0]}</p>
        )}
      </div>

      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Envoi en cours...
          </>
        ) : (
          'Envoyer'
        )}
      </Button>
    </form>
  )
}
