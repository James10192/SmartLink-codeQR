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

interface PaymentRetryReminderEmailProps {
  userName: string
  planName: string
  amount: number
  currency: string
  failedDate: Date
  daysSinceFailed: number
  transactionId: string
  retryUrl: string
}

export default function PaymentRetryReminderEmail({
  userName = 'Utilisateur',
  planName = 'Pro Yearly',
  amount = 30000,
  currency = 'FCFA',
  failedDate = new Date(),
  daysSinceFailed = 3,
  transactionId = 'TXN123456',
  retryUrl = 'https://smartlink.ci/dashboard/upgrade',
}: PaymentRetryReminderEmailProps) {
  const failedDateStr = failedDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const isUrgent = daysSinceFailed >= 7

  return (
    <Html>
      <Head />
      <Preview>
        {isUrgent ? '⚠️ Dernier rappel' : '🔔 Rappel'} - Paiement en attente
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>SmartLink</Heading>

          <Section style={section}>
            <Section style={isUrgent ? urgentBanner : reminderBanner}>
              <Text style={isUrgent ? urgentText : reminderText}>
                {isUrgent ? '⚠️ Dernier rappel' : '🔔 Rappel amical'}
              </Text>
            </Section>

            <Text style={text}>Bonjour {userName},</Text>

            <Text style={text}>
              {isUrgent
                ? `Cela fait maintenant ${daysSinceFailed} jours que votre paiement a échoué. Nous vous rappelons une dernière fois que votre abonnement SmartLink n'a pas pu être activé.`
                : `Nous vous rappelons que votre paiement pour SmartLink a échoué il y a ${daysSinceFailed} jours.`}
            </Text>

            <Section style={summaryBox}>
              <Text style={summaryLabel}>Plan souhaité</Text>
              <Text style={summaryValue}>{planName}</Text>

              <Text style={summaryLabel}>Montant</Text>
              <Text style={summaryValue}>
                {amount.toLocaleString('fr-FR')} {currency}
              </Text>

              <Text style={summaryLabel}>Tentative de paiement</Text>
              <Text style={summaryValue}>{failedDateStr}</Text>

              <Text style={summaryLabel}>N° de transaction</Text>
              <Text style={summaryValueSmall}>{transactionId}</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={isUrgent ? urgentButton : button} href={retryUrl}>
                Finaliser mon paiement
              </Button>
            </Section>

            {isUrgent && (
              <Section style={warningBox}>
                <Text style={warningText}>
                  ⏰ <strong>Attention :</strong> Si vous souhaitez toujours profiter de
                  SmartLink {planName}, veuillez réessayer votre paiement dès que possible.
                  Nous ne pourrons plus garantir la disponibilité de votre profil
                  personnalisé après 30 jours.
                </Text>
              </Section>
            )}

            <Heading style={h3}>Pourquoi mon paiement a-t-il échoué ?</Heading>

            <Text style={text}>Les raisons les plus fréquentes :</Text>
            <ul style={list}>
              <li>Solde insuffisant au moment du paiement</li>
              <li>Carte bancaire expirée ou bloquée</li>
              <li>Limite de paiement dépassée</li>
              <li>Informations de paiement incorrectes</li>
            </ul>

            <Section style={helpBox}>
              <Text style={helpTitle}>Besoin d&apos;aide ?</Text>
              <Text style={helpText}>
                Notre équipe est là pour vous aider à finaliser votre abonnement :
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
            </Section>

            <Text style={text}>
              Merci de votre intérêt pour SmartLink. Nous espérons vous compter bientôt parmi
              nos utilisateurs {planName} !
            </Text>

            <Text style={footer}>
              Vous recevez cet email car votre paiement pour SmartLink a échoué le{' '}
              {failedDateStr}. Si vous ne souhaitez plus recevoir ces rappels, vous pouvez
              ignorer cet email.
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

const reminderBanner = {
  backgroundColor: '#FEF3C7',
  border: '2px solid #F59E0B',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '24px 0',
}

const reminderText = {
  color: '#92400E',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0',
}

const urgentBanner = {
  backgroundColor: '#FEF2F2',
  border: '2px solid #DC2626',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '24px 0',
}

const urgentText = {
  color: '#DC2626',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0',
}

const summaryBox = {
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const summaryLabel = {
  color: '#6B7280',
  fontSize: '13px',
  fontWeight: 'bold',
  margin: '12px 0 4px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const summaryValue = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const summaryValueSmall = {
  color: '#6B7280',
  fontSize: '13px',
  fontFamily: 'monospace',
  margin: '0 0 16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#F59E0B',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
}

const urgentButton = {
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
