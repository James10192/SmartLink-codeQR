import QRCode from 'qrcode'

export interface QRCodeOptions {
  color?: {
    dark?: string
    light?: string
  }
  width?: number
  margin?: number
}

export async function generateQRCode(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    color = { dark: '#000000', light: '#FFFFFF' },
    width = 512,
    margin = 4,
  } = options

  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      color,
      width,
      margin,
      errorCorrectionLevel: 'H', // High error correction
    })

    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

export async function generateQRCodeBuffer(
  data: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const {
    color = { dark: '#000000', light: '#FFFFFF' },
    width = 512,
    margin = 4,
  } = options

  try {
    const buffer = await QRCode.toBuffer(data, {
      color,
      width,
      margin,
      errorCorrectionLevel: 'H',
      type: 'png',
    })

    return buffer
  } catch (error) {
    console.error('Error generating QR code buffer:', error)
    throw new Error('Failed to generate QR code buffer')
  }
}

/**
 * Generates a QR code as SVG string
 *
 * @param data - Data to encode in QR code
 * @param options - QR code customization options
 * @returns SVG string
 */
export async function generateQRCodeSVG(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    color = { dark: '#000000', light: '#FFFFFF' },
    width = 512,
    margin = 4,
  } = options

  try {
    const svgString = await QRCode.toString(data, {
      type: 'svg',
      color,
      width,
      margin,
      errorCorrectionLevel: 'H',
    })

    return svgString
  } catch (error) {
    console.error('Error generating QR code SVG:', error)
    throw new Error('Failed to generate QR code SVG')
  }
}