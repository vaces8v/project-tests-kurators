import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function PATCH(
  req: NextRequest, 
  { params }: { params: { testId: string } }
) {
  try {
    // Verify user authentication and role
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'CURATOR') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 403 }
      )
    }

    // Extract test ID and new status from request
    const { testId } = params
    const { status } = await req.json()

    // Validate status
    const validStatuses = ['ACTIVE', 'COMPLETED', 'DRAFT']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' }, 
        { status: 400 }
      )
    }

    // Update test status
    const updatedTest = await prisma.test.update({
      where: { id: testId },
      data: { status },
      select: {
        id: true,
        title: true,
        status: true
      }
    })

    return NextResponse.json(updatedTest, { status: 200 })
  } catch (error) {
    console.error('Error updating test status:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update test status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
