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

interface SubscriptionExpiredEmailProps {
  userName: string
  planName: string
  expiredAt: Date
  renewUrl: string
}

export default function SubscriptionExpiredEmail({
  userName = 'Utilisateur',
  planName = 'Pro',
  expiredAt = new Date(),
  renewUrl = 'https://smartlink.ci/dashboard/upgrade',
}: SubscriptionExpiredEmailProps) {
  const dateStr = expiredAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Html>
      <Head />
      <Preview>Votre abonnement SmartLink a expiré - Réactivez-le maintenant</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>SmartLink</Heading>

          <Section style={section}>
            <Heading style={h2}>⚠️ Votre abonnement a expiré</Heading>

            <Text style={text}>Bonjour {userName},</Text>

            <Text style={text}>
              Votre abonnement {planName} a expiré le {dateStr}.
            </Text>

            <Section style={alertBox}>
              <Text style={alertText}>
                <strong>Fonctionnalités désactivées :</strong>
              </Text>
              <ul style={alertList}>
                <li>❌ Vos QR codes sont désactivés</li>
                <li>❌ Accès aux statistiques bloqué</li>
                <li>❌ Personnalisation du design indisponible</li>
                <li>❌ Profils supplémentaires masqués (seul le 1er reste actif)</li>
              </ul>
            </Section>

            <Text style={text}>
              Vous disposez d&apos;une <strong>période de grâce de 30 jours</strong> pour
              renouveler votre abonnement. Tous vos QR codes et paramètres seront
              automatiquement réactivés dès le paiement.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={renewUrl}>
                Réactiver mon abonnement
              </Button>
            </Section>

            <Text style={text}>
              Après le renouvellement, vous retrouverez immédiatement :
            </Text>
            <ul style={list}>
              <li>✅ Tous vos QR codes actifs</li>
              <li>✅ Vos 3 profils personnalisés</li>
              <li>✅ Statistiques détaillées en temps réel</li>
              <li>✅ Personnalisation complète</li>
            </ul>

            <Section style={warningBox}>
              <Text style={warningText}>
                ⚠️ <strong>Important :</strong> Si vous ne renouvelez pas dans les 30 jours,
                vos QR codes seront définitivement désactivés et vos profils supplémentaires
                seront supprimés.
              </Text>
            </Section>

            <Text style={footer}>
              Des questions ? Contactez-nous à{' '}
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
  color: '#DC2626',
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

const alertBox = {
  backgroundColor: '#FEF2F2',
  border: '2px solid #DC2626',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const alertText = {
  color: '#DC2626',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const alertList = {
  color: '#991B1B',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
  paddingLeft: '20px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#DC2626',
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

const warningBox = {
  backgroundColor: '#FFFBEB',
  border: '1px solid #F59E0B',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const warningText = {
  color: '#92400E',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
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
