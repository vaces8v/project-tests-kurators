import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  req: NextRequest, 
  { params }: { params: { groupId: string } }
) {
  try {
    const groupId = params.groupId

    // Fetch test results to get actual test statuses
    const testResults = await prisma.testResult.findMany({
      where: {
        student: {
          groupId: groupId
        }
      },
      include: {
        student: true,
        test: true
      }
    })

    // Fetch test assignments to get students who started but not finished
    const testAssignments = await prisma.testAssignment.findMany({
      where: {
        groupId: groupId,
        status: 'ACTIVE'
      },
      include: {
        student: true,
        test: true
      }
    })

    // Combine results and assignments
    const completedStudents = testResults.map(result => ({
      studentId: result.studentId,
      studentName: `${result.student.firstName} ${result.student.lastName}`,
      testId: result.testId,
      testTitle: result.test.title,
      status: 'COMPLETED'
    }))

    const inProgressStudents = testAssignments
      .filter(assignment => 
        !testResults.some(result => 
          result.studentId === assignment.studentId && 
          result.testId === assignment.testId
        )
      )
      .map(assignment => ({
        studentId: assignment.studentId,
        studentName: `${assignment.student?.firstName ?? ''} ${assignment.student?.lastName ?? ''}`,
        testId: assignment.testId,
        testTitle: assignment.test.title,
        status: 'ACTIVE'
      }))

    const testStatuses = [...completedStudents, ...inProgressStudents]

    return NextResponse.json(testStatuses, { status: 200 })
  } catch (error) {
    console.error('Error fetching test statuses:', error)
    return NextResponse.json({ error: 'Failed to fetch test statuses' }, { status: 500 })
  }
}
