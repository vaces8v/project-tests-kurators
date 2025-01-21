import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CURATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const testLinks = await prisma.testLink.findMany({
      where: {
        user: { id: session.user.id }
      },
      select: {
        id: true,
        linkId: true,
        expiresAt: true
      }
    })

    return NextResponse.json(testLinks)
  } catch (error) {
    console.error('Error fetching test links:', error)
    return NextResponse.json({ error: 'Failed to fetch test links' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CURATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('id')

    if (!linkId) {
      return NextResponse.json({ error: 'Link ID is required' }, { status: 400 })
    }

    await prisma.testLink.delete({
      where: { 
        id: linkId,
        user: { id: session.user.id }
      }
    })

    return NextResponse.json({ message: 'Link deleted successfully' })
  } catch (error) {
    console.error('Error deleting test link:', error)
    return NextResponse.json({ error: 'Failed to delete test link' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CURATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { testId, expiresAt } = body

    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 })
    }

    // Generate a unique link ID (you can use any method you prefer)
    const linkId = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15)

    const testLink = await prisma.testLink.create({
      data: {
        linkId,
        createdBy: session.user.id,
        expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        testId: testId
      }
    })

    return NextResponse.json({ 
      id: testLink.id,
      linkId: testLink.linkId,
      expiresAt: testLink.expiresAt
    })
  } catch (error) {
    console.error('Error creating test link:', error)
    return NextResponse.json({ error: 'Failed to create test link' }, { status: 500 })
  }
}
