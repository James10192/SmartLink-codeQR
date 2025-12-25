'use client'

import { useState, useActionState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel } from '@/components/ui/field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { sendContactEmail, type ContactFormState } from '@/lib/actions/contact'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface ContactDialogProps {
  trigger?: React.ReactNode
  children?: React.ReactNode
}

const initialState: ContactFormState = {
  success: false,
}

export function ContactDialog({ trigger, children }: ContactDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(sendContactEmail, initialState)

  // Close dialog on success
  if (state.success && open) {
    setTimeout(() => setOpen(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Contact</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Contactez-nous</DialogTitle>
          <DialogDescription>
            Envoyez-nous un message et nous vous répondrons dans les plus brefs délais.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {state.message && (
            <Alert variant={state.success ? 'default' : 'destructive'}>
              {state.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <Field>
            <FieldLabel htmlFor="name">Nom complet</FieldLabel>
            <Input
              id="name"
              name="name"
              placeholder="Jean Kouassi"
              required
              disabled={isPending}
            />
            {state.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
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
          </Field>

          <Field>
            <FieldLabel htmlFor="subject">Sujet</FieldLabel>
            <Input
              id="subject"
              name="subject"
              placeholder="Demande d'information"
              required
              disabled={isPending}
            />
            {state.errors?.subject && (
              <p className="text-sm text-destructive">{state.errors.subject[0]}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="message">Message</FieldLabel>
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
          </Field>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Envoyer le message'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
