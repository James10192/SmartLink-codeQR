'use server'

import { z } from 'zod'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const contactSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  subject: z.string().min(5, 'Le sujet doit contenir au moins 5 caractères'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
})

export type ContactFormState = {
  success: boolean
  message?: string
  errors?: {
    name?: string[]
    email?: string[]
    subject?: string[]
    message?: string[]
  }
}

export async function sendContactEmail(
  prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  try {
    // Validate form data
    const validatedFields = contactSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { name, email, subject, message } = validatedFields.data

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: 'SmartLink Contact <noreply@smartlink.ci>', // Update with your verified domain
      to: ['marcel-_12@outlook.fr'],
      replyTo: email,
      subject: `[SmartLink Contact] ${subject}`,
      html: `
        <h2>Nouveau message de contact</h2>
        <p><strong>De:</strong> ${name} (${email})</p>
        <p><strong>Sujet:</strong> ${subject}</p>
        <hr />
        <p>${message.replace(/\n/g, '<br />')}</p>
      `,
    })

    if (error) {
      console.error('[Contact Email Error]', error)
      return {
        success: false,
        message: 'Erreur lors de l\'envoi du message',
      }
    }

    return {
      success: true,
      message: 'Message envoyé avec succès !',
    }
  } catch (error) {
    console.error('[Contact Server Action Error]', error)
    return {
      success: false,
      message: 'Une erreur est survenue',
    }
  }
}
