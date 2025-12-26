/**
 * CinetPay Integration
 * Documentation: https://docs.cinetpay.com/
 *
 * Supports Mobile Money operators in West Africa:
 * - Orange Money (Côte d'Ivoire, Mali, Sénégal)
 * - MTN Money (Côte d'Ivoire, Bénin)
 * - Moov Money (Côte d'Ivoire, Bénin, Togo)
 * - Wave (Sénégal, Côte d'Ivoire)
 */

import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

const CINETPAY_API_URL = 'https://api-checkout.cinetpay.com/v2'

interface CinetPayConfig {
  apiKey: string
  siteId: string
  secretKey: string
  notifyUrl: string
  returnUrl: string
}

interface InitPaymentParams {
  amount: number
  transactionId: string
  description: string
  customerName: string
  customerEmail: string
  customerPhoneNumber?: string
  currency?: 'XOF' | 'XAF' | 'CDF' | 'GNF'
  channels?: string // 'ALL' or specific: 'MOBILE_MONEY', 'CREDIT_CARD'
  metadata?: Record<string, any>
}

interface InitPaymentResponse {
  code: string
  message: string
  data: {
    payment_url: string
    payment_token: string
  }
  api_response_id: string
}

interface CheckPaymentResponse {
  code: string
  message: string
  data: {
    cpm_trans_id: string
    cpm_trans_date: string
    cpm_amount: number
    cpm_currency: string
    cpm_payid: string
    cpm_payment_date: string
    cpm_payment_time: string
    cpm_error_message: string
    payment_method: string
    cpm_phone_prefixe: string
    cel_phone_num: string
    cpm_ipn_ack: string
    created_at: string
    updated_at: string
    cpm_result: string
    cpm_trans_status: string
    cpm_designation: string
    buyer_name: string
    cpm_site_id: string
    signature: string
    payment_method_type: string
  }
  api_response_id: string
}

/**
 * Get CinetPay configuration from environment variables
 */
export function getCinetPayConfig(): CinetPayConfig {
  const apiKey = process.env.CINETPAY_API_KEY
  const siteId = process.env.CINETPAY_SITE_ID
  const secretKey = process.env.CINETPAY_SECRET_KEY
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!apiKey || !siteId || !secretKey) {
    throw new Error(
      'CinetPay configuration missing. Please set CINETPAY_API_KEY, CINETPAY_SITE_ID, and CINETPAY_SECRET_KEY in environment variables.'
    )
  }

  return {
    apiKey,
    siteId,
    secretKey,
    notifyUrl: `${baseUrl}/api/webhooks/cinetpay`,
    returnUrl: `${baseUrl}/payment/success`,
  }
}

/**
 * Generate a unique transaction ID
 */
export function generateTransactionId(): string {
  return `SL-${Date.now()}-${uuidv4().slice(0, 8)}`
}

/**
 * Generate CinetPay signature for security
 */
export function generateSignature(data: Record<string, any>, secretKey: string): string {
  // Sort keys alphabetically and concatenate values
  const sortedKeys = Object.keys(data).sort()
  const concatenated = sortedKeys.map((key) => data[key]).join('')

  // Create SHA256 hash
  return crypto.createHash('sha256').update(concatenated + secretKey).digest('hex')
}

/**
 * Initialize a payment with CinetPay
 * Returns a payment URL where the user will be redirected
 */
export async function initPayment(params: InitPaymentParams): Promise<InitPaymentResponse> {
  const config = getCinetPayConfig()

  const payload = {
    apikey: config.apiKey,
    site_id: config.siteId,
    transaction_id: params.transactionId,
    amount: params.amount,
    currency: params.currency || 'XOF',
    description: params.description,
    customer_name: params.customerName,
    customer_surname: params.customerName.split(' ')[1] || '',
    customer_email: params.customerEmail,
    customer_phone_number: params.customerPhoneNumber || '',
    notify_url: config.notifyUrl,
    return_url: config.returnUrl,
    channels: params.channels || 'ALL',
    metadata: JSON.stringify(params.metadata || {}),
  }

  try {
    const response = await axios.post<InitPaymentResponse>(
      `${CINETPAY_API_URL}/payment`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.data.code !== '201') {
      throw new Error(response.data.message || 'Payment initialization failed')
    }

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || 'Failed to initialize payment with CinetPay'
      )
    }
    throw error
  }
}

/**
 * Check payment status
 * Use this to verify if a payment was successful
 */
export async function checkPayment(transactionId: string): Promise<CheckPaymentResponse> {
  const config = getCinetPayConfig()

  const payload = {
    apikey: config.apiKey,
    site_id: config.siteId,
    transaction_id: transactionId,
  }

  try {
    const response = await axios.post<CheckPaymentResponse>(
      `${CINETPAY_API_URL}/payment/check`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.data.code !== '00') {
      throw new Error(response.data.message || 'Payment check failed')
    }

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || 'Failed to check payment status'
      )
    }
    throw error
  }
}

/**
 * Verify webhook signature
 * CRITICAL: Always verify signatures to prevent fraud
 */
export function verifyWebhookSignature(payload: any, receivedSignature: string): boolean {
  const config = getCinetPayConfig()

  const dataToSign = {
    cpm_site_id: payload.cpm_site_id,
    cpm_trans_id: payload.cpm_trans_id,
    cpm_trans_date: payload.cpm_trans_date,
    cpm_amount: payload.cpm_amount,
    cpm_currency: payload.cpm_currency,
    signature: payload.signature,
    payment_method: payload.payment_method,
    cel_phone_num: payload.cel_phone_num,
    cpm_phone_prefixe: payload.cpm_phone_prefixe,
    cpm_language: payload.cpm_language,
    cpm_version: payload.cpm_version,
    cpm_payment_config: payload.cpm_payment_config,
    cpm_page_action: payload.cpm_page_action,
    cpm_custom: payload.cpm_custom,
    cpm_designation: payload.cpm_designation,
    buyer_name: payload.buyer_name,
  }

  const expectedSignature = generateSignature(dataToSign, config.secretKey)

  return expectedSignature === receivedSignature
}

/**
 * Get payment amount for a subscription plan
 */
export function getSubscriptionAmount(plan: string): number {
  const amounts: Record<string, number> = {
    PRO_DIGITAL: 3000, // 3 000 FCFA/mois
    PACK_STARTER: 29900, // 29 900 FCFA (paiement unique - PRO 1 an + 50 cartes)
    CORPORATE: 0, // Sur devis (contact required)
  }

  return amounts[plan] || 0
}

/**
 * Get plan display name for CinetPay description
 */
export function getPlanDisplayName(plan: string): string {
  const names: Record<string, string> = {
    PRO_DIGITAL: 'SmartLink PRO Digital',
    PACK_STARTER: 'SmartLink Pack Starter',
    CORPORATE: 'SmartLink Corporate',
  }

  return names[plan] || 'SmartLink Subscription'
}
