import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface SubscriptionReminderEmailProps {
  userName: string
  planName: string
  daysLeft: number
  expiresAt: Date
  renewUrl: string
}

export default function SubscriptionReminderEmail({
  userName = 'Utilisateur',
  planName = 'Pro',
  daysLeft = 7,
  expiresAt = new Date(),
  renewUrl = 'https://smartlink.ci/dashboard/upgrade',
}: SubscriptionReminderEmailProps) {
  const previewText = getPreviewText(daysLeft)
  const urgencyColor = daysLeft <= 1 ? '#DC2626' : daysLeft <= 3 ? '#EA580C' : '#2563EB'

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>SmartLink</Heading>

          <Section style={section}>
            <Heading style={{ ...h2, color: urgencyColor }}>
              {getHeadingText(daysLeft)}
            </Heading>

            <Text style={text}>Bonjour {userName},</Text>

            <Text style={text}>{getBodyText(daysLeft, planName, expiresAt)}</Text>

            {daysLeft === 0 && (
              <Text style={{ ...text, fontWeight: 'bold', color: '#DC2626' }}>
                ⚠️ Votre abonnement expire aujourd&apos;hui. Vos QR codes seront désactivés à
                minuit.
              </Text>
            )}

            <Section style={buttonContainer}>
              <Button style={button} href={renewUrl}>
                Renouveler maintenant
              </Button>
            </Section>

            <Text style={text}>
              Avec votre abonnement {planName}, vous bénéficiez de :
            </Text>
            <ul style={list}>
              <li>3 profils personnalisés</li>
              <li>QR codes dynamiques illimités</li>
              <li>Statistiques détaillées</li>
              <li>Personnalisation du design</li>
            </ul>

            <Text style={footer}>
              Des questions ? Répondez à cet email ou contactez-nous à{' '}
              <a href="mailto:support@smartlink.ci" style={link}>
                support@smartlink.ci
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

function getPreviewText(daysLeft: number): string {
  if (daysLeft === 0) return '⚠️ Votre abonnement expire aujourd\'hui'
  if (daysLeft === 1) return 'Plus qu\'1 jour pour renouveler votre abonnement'
  if (daysLeft === 3) return 'Plus que 3 jours avant expiration'
  return `Plus que ${daysLeft} jours avant expiration`
}

function getHeadingText(daysLeft: number): string {
  if (daysLeft === 0) return '⚠️ Dernier jour !'
  if (daysLeft === 1) return '⏰ Plus qu\'1 jour'
  if (daysLeft === 3) return '📅 Plus que 3 jours'
  return '🔔 Rappel de renouvellement'
}

function getBodyText(daysLeft: number, planName: string, expiresAt: Date): string {
  const dateStr = expiresAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  if (daysLeft === 0) {
    return `Votre abonnement ${planName} expire aujourd'hui (${dateStr}). Renouvelez dès maintenant pour conserver l'accès à toutes vos fonctionnalités.`
  }

  if (daysLeft === 1) {
    return `Votre abonnement ${planName} expire demain (${dateStr}). Ne perdez pas l'accès à vos QR codes et statistiques !`
  }

  return `Votre abonnement ${planName} expire dans ${daysLeft} jours (${dateStr}). Renouvelez-le dès maintenant pour continuer à profiter de toutes vos fonctionnalités.`
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const section = {
  padding: '0 48px',
}

const h1 = {
  color: '#000000',
  fontSize: '32px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '40px 0',
}

const h2 = {
  color: '#2563EB',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '30px 0 20px',
}

const text = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#000000',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
}

const list = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '26px',
  marginLeft: '20px',
}

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  marginTop: '40px',
}

const link = {
  color: '#2563EB',
  textDecoration: 'underline',
}
