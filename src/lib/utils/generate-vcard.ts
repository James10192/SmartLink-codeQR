import vCardsJS from 'vcards-js'

export interface VCardData {
  fullName: string
  firstName?: string
  lastName?: string
  organization?: string
  jobTitle?: string
  email?: string
  phoneNumber?: string
  website?: string
  address?: string
  photo?: string
}

export function generateVCard(data: VCardData): string {
  const vCard = vCardsJS()

  // Name
  const nameParts = data.fullName.split(' ')
  vCard.firstName = data.firstName || nameParts[0] || ''
  vCard.lastName = data.lastName || nameParts.slice(1).join(' ') || ''

  // Organization
  if (data.organization) {
    vCard.organization = data.organization
  }

  // Title
  if (data.jobTitle) {
    vCard.title = data.jobTitle
  }

  // Email
  if (data.email) {
    vCard.email = data.email
  }

  // Phone
  if (data.phoneNumber) {
    vCard.cellPhone = data.phoneNumber
  }

  // Website
  if (data.website) {
    vCard.url = data.website
  }

  // Address
  if (data.address) {
    vCard.workAddress.label = 'Work Address'
    vCard.workAddress.street = data.address
  }

  // Photo (URL)
  if (data.photo) {
    vCard.photo.embedFromString(data.photo, 'JPEG')
  }

  // Version
  vCard.version = '3.0'

  return vCard.getFormattedString()
}
