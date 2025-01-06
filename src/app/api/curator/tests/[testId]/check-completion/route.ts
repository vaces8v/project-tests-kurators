import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(
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

    const { testId } = params

    // Find all test assignments for this test
    const testAssignments = await prisma.testAssignment.findMany({
      where: { testId },
      select: { studentId: true }
    })

    // Find test results for this test
    const testResults = await prisma.testResult.findMany({
      where: { 
        testId,
        studentId: { in: testAssignments.map(assignment => assignment.studentId).filter(id => id !== null) }
      }
    })

    // Check if all assigned students have completed the test
    const allStudentsCompleted = testAssignments.length > 0 && 
      testAssignments.length === testResults.length

    if (allStudentsCompleted) {
      // Update test status to COMPLETED
      const updatedTest = await prisma.test.update({
        where: { id: testId },
        data: { status: 'COMPLETED' },
        select: {
          id: true,
          title: true,
          status: true
        }
      })

      return NextResponse.json(
        { 
          message: 'Test completed', 
          test: updatedTest,
          allStudentsCompleted: true 
        }, 
        { status: 200 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Test not yet completed', 
        completedResults: testResults.length,
        totalAssignments: testAssignments.length,
        allStudentsCompleted: false 
      }, 
      { status: 200 }
    )
  } catch (error) {
    console.error('Error checking test completion:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to check test completion',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
