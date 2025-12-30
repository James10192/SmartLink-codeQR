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

interface PaymentFailedEmailProps {
  userName: string
  planName: string
  amount: number
  currency: string
  transactionId: string
  errorMessage?: string
  retryUrl: string
}

export default function PaymentFailedEmail({
  userName = 'Utilisateur',
  planName = 'Pro Yearly',
  amount = 30000,
  currency = 'FCFA',
  transactionId = 'TXN123456',
  errorMessage = 'Le paiement n\'a pas pu être traité',
  retryUrl = 'https://smartlink.ci/dashboard/upgrade',
}: PaymentFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>⚠️ Échec du paiement SmartLink - Action requise</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>SmartLink</Heading>

          <Section style={section}>
            <Section style={errorBanner}>
              <Text style={errorText}>⚠️ Paiement échoué</Text>
            </Section>

            <Text style={text}>Bonjour {userName},</Text>

            <Text style={text}>
              Nous n&apos;avons malheureusement pas pu traiter votre paiement pour
              l&apos;abonnement <strong>{planName}</strong>.
            </Text>

            <Section style={detailsBox}>
              <Text style={detailsLabel}>Montant</Text>
              <Text style={detailsValue}>
                {amount.toLocaleString('fr-FR')} {currency}
              </Text>

              <Text style={detailsLabel}>N° de transaction</Text>
              <Text style={detailsValueSmall}>{transactionId}</Text>

              {errorMessage && (
                <>
                  <Text style={detailsLabel}>Raison de l&apos;échec</Text>
                  <Text style={detailsError}>{errorMessage}</Text>
                </>
              )}
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={retryUrl}>
                Réessayer le paiement
              </Button>
            </Section>

            <Heading style={h3}>Que faire maintenant ?</Heading>

            <Text style={text}>
              <strong>1. Vérifiez vos informations de paiement</strong>
            </Text>
            <ul style={list}>
              <li>Solde suffisant sur votre compte</li>
              <li>Carte bancaire valide et non expirée</li>
              <li>Limites de paiement non atteintes</li>
            </ul>

            <Text style={text}>
              <strong>2. Méthodes de paiement disponibles</strong>
            </Text>
            <ul style={list}>
              <li>💳 Carte bancaire (Visa, Mastercard, Amex)</li>
              <li>
                📱 Mobile Money <em>(bientôt disponible)</em>
              </li>
            </ul>

            <Section style={helpBox}>
              <Text style={helpTitle}>Besoin d&apos;aide ?</Text>
              <Text style={helpText}>
                Si le problème persiste après plusieurs tentatives, voici comment nous
                contacter :
              </Text>
              <ul style={helpList}>
                <li>
                  📧 Email :{' '}
                  <a href="mailto:support@smartlink.ci" style={link}>
                    support@smartlink.ci
                  </a>
                </li>
                <li>
                  💬 WhatsApp :{' '}
                  <a href="https://wa.me/2250708413484" style={link}>
                    +225 07 08 41 34 84
                  </a>
                </li>
              </ul>
              <Text style={helpText}>
                Merci d&apos;inclure votre numéro de transaction :{' '}
                <code style={code}>{transactionId}</code>
              </Text>
            </Section>

            <Text style={footer}>
              Cet email a été envoyé suite à une tentative de paiement sur SmartLink. Si vous
              n&apos;êtes pas à l&apos;origine de cette transaction, veuillez nous contacter
              immédiatement.
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

const h3 = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '24px 0 12px',
}

const text = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const errorBanner = {
  backgroundColor: '#FEF2F2',
  border: '2px solid #DC2626',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '24px 0',
}

const errorText = {
  color: '#DC2626',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0',
}

const detailsBox = {
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const detailsLabel = {
  color: '#6B7280',
  fontSize: '13px',
  fontWeight: 'bold',
  margin: '12px 0 4px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const detailsValue = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const detailsValueSmall = {
  color: '#6B7280',
  fontSize: '13px',
  fontFamily: 'monospace',
  margin: '0 0 16px 0',
}

const detailsError = {
  color: '#DC2626',
  fontSize: '14px',
  backgroundColor: '#FEF2F2',
  padding: '8px 12px',
  borderRadius: '4px',
  margin: '0',
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
  fontSize: '15px',
  lineHeight: '24px',
  marginLeft: '20px',
  marginTop: '8px',
}

const helpBox = {
  backgroundColor: '#EFF6FF',
  border: '1px solid #3B82F6',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const helpTitle = {
  color: '#1E40AF',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const helpText = {
  color: '#1E3A8A',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
}

const helpList = {
  color: '#1E3A8A',
  fontSize: '14px',
  lineHeight: '24px',
  marginLeft: '20px',
  marginTop: '8px',
}

const code = {
  backgroundColor: '#F3F4F6',
  padding: '2px 6px',
  borderRadius: '4px',
  fontFamily: 'monospace',
  fontSize: '13px',
}

const footer = {
  color: '#8898aa',
  fontSize: '13px',
  lineHeight: '22px',
  marginTop: '40px',
  borderTop: '1px solid #E5E7EB',
  paddingTop: '24px',
}

const link = {
  color: '#2563EB',
  textDecoration: 'underline',
}
