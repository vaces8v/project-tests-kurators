import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { studentId, testId, responses } = await req.json()

    // Validate input
    if (!studentId || !testId || !responses) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate total score
    let totalScore = 0
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: { include: { options: true } } }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Create test result
    const testResult = await prisma.testResult.create({
      data: {
        studentId,
        testId,
        totalScore: 0, // Will be updated later
        responses: {
          create: test.questions.map(question => {
            const studentResponse = responses[question.id]
            let score = 0
            
            // Score calculation logic
            switch(question.type) {
              case 'SINGLE_CHOICE':
                const selectedOption = question.options.find(opt => opt.id === studentResponse)
                score = selectedOption?.score || 0
                break
              case 'MULTIPLE_CHOICE':
                score = studentResponse?.reduce((total: number, optId: string) => {
                  const option = question.options.find(opt => opt.id === optId)
                  return total + (option?.score || 0)
                }, 0) || 0
                break
              case 'TEXT':
                // For text questions, manual scoring might be needed
                score = 0
                break
            }

            totalScore += score

            return {
              questionId: question.id,
              selectedOption: studentResponse ? JSON.stringify(studentResponse) : null,
              score
            }
          })
        }
      },
      include: { responses: true }
    })

    // Update total score
    await prisma.testResult.update({
      where: { id: testResult.id },
      data: { totalScore }
    })

    return NextResponse.json(testResult, { status: 201 })
  } catch (error) {
    console.error('Test submission error:', error)
    return NextResponse.json({ error: 'Failed to submit test' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const groupId = searchParams.get('groupId')
    const studentId = searchParams.get('studentId')

    let whereCondition = {}
    if (groupId) {
      whereCondition = {
        test: {
          testAssignments: {
            some: {
              groupId
            }
          }
        }
      }
    }
    if (studentId) {
      whereCondition = {
        ...whereCondition,
        studentId
      }
    }

    const testResults = await prisma.testResult.findMany({
      where: whereCondition,
      include: {
        student: true,
        test: true,
        responses: {
          include: {
            question: true
          }
        }
      }
    })

    return NextResponse.json(testResults)
  } catch (error) {
    console.error('Fetching test results error:', error)
    return NextResponse.json({ error: 'Failed to fetch test results' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
