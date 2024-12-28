import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Ensure only curators can send test links
    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 })
    }

    if (session.user.role !== 'CURATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { studentIds, testId, groupId } = await request.json()

    // Validate input
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'Invalid student selection' }, { status: 400 })
    }

    // Verify students belong to curator's groups
    const studentsToSend = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        group: {
          curatorId: session.user.id
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    })

    // Create test assignments for selected students
    const testAssignments = await prisma.testAssignment.createMany({
      data: studentsToSend.map(student => ({
        studentId: student.id,
        status: 'ACTIVE', 
        testId: testId, 
        groupId: groupId, 
      })),
      skipDuplicates: true 
    })

    return NextResponse.json({
      message: 'Test links sent successfully',
      studentsNotified: studentsToSend.length,
      assignmentsCreated: testAssignments.count
    })
  } catch (error) {
    console.error('Error sending test links:', error)
    return NextResponse.json({ 
      error: 'Failed to send test links', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
