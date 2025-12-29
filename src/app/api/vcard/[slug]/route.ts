import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { generateVCard } from '@/lib/utils/generate-vcard'
import { createContactSaveNotification } from '@/lib/notifications/create-notification'
import { getEffectivePlan } from '@/lib/utils/tier-enforcement'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Récupérer le profil public
    const profile = await prisma.profile.findUnique({
      where: { slug, isPublic: true },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        company: true,
        email: true,
        phoneNumber: true,
        website: true,
        address: true,
        avatarUrl: true,
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Générer le vCard
    const vCardString = generateVCard({
      fullName: profile.fullName,
      organization: profile.company || undefined,
      jobTitle: profile.jobTitle || undefined,
      email: profile.email,
      phoneNumber: profile.phoneNumber,
      website: profile.website || undefined,
      address: profile.address || undefined,
      photo: profile.avatarUrl || undefined,
    })

    // Incrémenter le compteur de sauvegardes de contact
    await prisma.profile.update({
      where: { id: profile.id },
      data: { contactSaves: { increment: 1 } },
    })

    // Create notification for profile owner
    const fullProfile = await prisma.profile.findUnique({
      where: { id: profile.id },
      include: {
        user: {
          include: {
            subscription: true
          }
        }
      }
    })

    if (fullProfile) {
      const plan = getEffectivePlan(fullProfile.user.subscription)
      await createContactSaveNotification(fullProfile.userId, profile.id, plan)
    }

    // Retourner le fichier vCard
    return new NextResponse(vCardString, {
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${slug}.vcf"`,
      },
    })
  } catch (error) {
    console.error('Error generating vCard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
