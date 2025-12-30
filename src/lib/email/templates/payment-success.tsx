import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Hr,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface PaymentSuccessEmailProps {
  userName: string
  planName: string
  amount: number
  currency: string
  paymentDate: Date
  expiresAt: Date
  transactionId: string
  dashboardUrl: string
}

export default function PaymentSuccessEmail({
  userName = 'Utilisateur',
  planName = 'Pro Yearly',
  amount = 30000,
  currency = 'FCFA',
  paymentDate = new Date(),
  expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  transactionId = 'TXN123456',
  dashboardUrl = 'https://smartlink.ci/dashboard',
}: PaymentSuccessEmailProps) {
  const paymentDateStr = paymentDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const expiresAtStr = expiresAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Html>
      <Head />
      <Preview>✅ Paiement confirmé - Bienvenue dans SmartLink {planName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>SmartLink</Heading>

          <Section style={section}>
            <Section style={successBanner}>
              <Text style={successText}>✅ Paiement réussi</Text>
            </Section>

            <Text style={text}>Bonjour {userName},</Text>

            <Text style={text}>
              Merci pour votre confiance ! Votre paiement a été confirmé avec succès.
            </Text>

            <Section style={receiptBox}>
              <Heading style={receiptHeading}>Reçu de paiement</Heading>

              <Section style={receiptRow}>
                <Text style={receiptLabel}>Plan souscrit</Text>
                <Text style={receiptValue}>{planName}</Text>
              </Section>

              <Section style={receiptRow}>
                <Text style={receiptLabel}>Montant payé</Text>
                <Text style={receiptValue}>
                  {amount.toLocaleString('fr-FR')} {currency}
                </Text>
              </Section>

              <Section style={receiptRow}>
                <Text style={receiptLabel}>Date de paiement</Text>
                <Text style={receiptValue}>{paymentDateStr}</Text>
              </Section>

              <Section style={receiptRow}>
                <Text style={receiptLabel}>Valable jusqu&apos;au</Text>
                <Text style={receiptValue}>{expiresAtStr}</Text>
              </Section>

              <Hr style={divider} />

              <Section style={receiptRow}>
                <Text style={receiptLabel}>N° de transaction</Text>
                <Text style={receiptValueSmall}>{transactionId}</Text>
              </Section>
            </Section>

            <Text style={text}>
              <strong>Vous avez maintenant accès à :</strong>
            </Text>
            <ul style={list}>
              <li>✅ 3 profils personnalisés</li>
              <li>✅ QR codes dynamiques illimités</li>
              <li>✅ Statistiques détaillées et analytiques</li>
              <li>✅ Personnalisation complète du design</li>
              <li>✅ Upload de CV et vidéo de présentation</li>
            </ul>

            <Section style={buttonContainer}>
              <Button style={button} href={dashboardUrl}>
                Accéder à mon dashboard
              </Button>
            </Section>

            <Section style={infoBox}>
              <Text style={infoText}>
                💡 <strong>Astuce :</strong> Commencez par créer votre premier profil et
                générer votre QR code. Vous pourrez ensuite le télécharger et le partager
                immédiatement !
              </Text>
            </Section>

            <Text style={footer}>
              Besoin d&apos;aide pour démarrer ? Consultez notre guide ou contactez-nous à{' '}
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

const text = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const successBanner = {
  backgroundColor: '#DCFCE7',
  border: '2px solid #16A34A',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '24px 0',
}

const successText = {
  color: '#16A34A',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0',
}

const receiptBox = {
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const receiptHeading = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
}

const receiptRow = {
  display: 'flex',
  justifyContent: 'space-between',
  margin: '12px 0',
}

const receiptLabel = {
  color: '#6B7280',
  fontSize: '14px',
  margin: '0',
  flex: '1',
}

const receiptValue = {
  color: '#111827',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'right' as const,
  flex: '1',
}

const receiptValueSmall = {
  color: '#6B7280',
  fontSize: '12px',
  fontFamily: 'monospace',
  margin: '0',
  textAlign: 'right' as const,
  flex: '1',
}

const divider = {
  borderColor: '#E5E7EB',
  margin: '16px 0',
}

const list = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '26px',
  marginLeft: '20px',
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

const infoBox = {
  backgroundColor: '#EFF6FF',
  border: '1px solid #3B82F6',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const infoText = {
  color: '#1E40AF',
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
