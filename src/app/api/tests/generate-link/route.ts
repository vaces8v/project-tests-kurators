import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Ensure only curators can generate test links
    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 })
    }

    if (session.user.role !== 'CURATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Generate a unique link ID
    const linkId = randomBytes(16).toString('hex')

    // Create a test link record
    const testLink = await prisma.testLink.create({
      data: {
        linkId: linkId,
        createdBy: session.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    })

    return NextResponse.json({ 
      linkId: testLink.linkId,
      expiresAt: testLink.expiresAt 
    })
  } catch (error) {
    console.error('Error generating test link:', error)
    return NextResponse.json({ 
      error: 'Failed to generate test link', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
