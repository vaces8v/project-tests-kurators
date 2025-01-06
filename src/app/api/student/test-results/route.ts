import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

interface TestResponse {
  questionId: string;
  selectedOption: string;
  score: number;
}

export async function POST(req: NextRequest) {
  try {
    // Verify user authentication
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 403 }
      )
    }

    // Parse request body
    const { 
      testId, 
      responses, 
      totalScore 
    }: { 
      testId: string; 
      responses: TestResponse[]; 
      totalScore: number 
    } = await req.json()

    // Find the student ID based on the logged-in user
    const student = await prisma.student.findFirst({
      where: { 
        group: {
          groupStudents: {
            some: {
              login: session.user.login 
            }
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' }, 
        { status: 404 }
      )
    }

    // Create test result
    const testResult = await prisma.testResult.create({
      data: {
        studentId: student.id,
        testId,
        totalScore,
        responses: {
          create: responses
            .filter((response: TestResponse) => 
              response.questionId != null && 
              response.selectedOption != null && 
              response.score != null
            )
            .map((response: TestResponse) => ({
              questionId: response.questionId,
              selectedOption: response.selectedOption,
              score: response.score
            }))
        }
      }
    })

    // Check if all students have completed the test
    const testAssignments = await prisma.testAssignment.findMany({
      where: { testId },
      select: { studentId: true }
    })

    const completedTestResults = await prisma.testResult.findMany({
      where: { 
        testId,
        studentId: { 
          in: testAssignments
            .map(assignment => assignment.studentId)
            .filter((studentId): studentId is string => studentId !== null) 
        }
      }
    })

    // If all assigned students have completed the test, update test status
    if (testAssignments.length > 0 && 
        testAssignments.length === completedTestResults.length) {
      await prisma.test.update({
        where: { id: testId },
        data: { status: 'COMPLETED' }
      })
    }

    return NextResponse.json(testResult, { status: 201 })
  } catch (error) {
    console.error('Error creating test result:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create test result',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
