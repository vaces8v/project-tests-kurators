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
