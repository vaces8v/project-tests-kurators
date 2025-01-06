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

    // Calculate total max score
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: { include: { options: true } } }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Calculate total max score
    const maxScore = test.questions.reduce((total, question) => {
      // Find the maximum possible score for the question
      switch(question.type) {
        case 'SINGLE_CHOICE':
          // For single choice, take the highest positive score
          const maxSingleChoiceScore = Math.max(
            ...question.options
              .filter(opt => (opt.score || 0) > 0)
              .map(opt => opt.score || 0)
          )
          return total + maxSingleChoiceScore
        case 'MULTIPLE_CHOICE':
          // Sum of all positive option scores
          const multipleChoiceMaxScore = question.options
            .filter(opt => (opt.score || 0) > 0)
            .reduce((sum, opt) => sum + (opt.score || 0), 0)
          return total + multipleChoiceMaxScore
        case 'TEXT':
          // For text questions, you might want to set a manual max score
          // For now, defaulting to 0
          return total + 0
        default:
          return total
      }
    }, 0)

    // Update test with calculated max score
    await prisma.test.update({
      where: { id: testId },
      data: { maxScore: Math.round(maxScore) }
    })

    // Calculate total score
    let totalScore = 0

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

    console.log('Fetching test results with params:', { groupId, studentId })

    // Find students in the group first
    const studentsInGroup = groupId 
      ? await prisma.student.findMany({
          where: { groupId },
          select: { id: true }
        }) 
      : []

    console.log('Students in group:', studentsInGroup)

    const studentIds = studentsInGroup.map(student => student.id)

    const whereCondition: Prisma.TestResultWhereInput = {
      ...(studentId && { studentId }),
      ...(groupId && { studentId: { in: studentIds } })
    }

    console.log('Where condition:', whereCondition)

    const testResults = await prisma.testResult.findMany({
      where: whereCondition,
      include: {
        student: true,
        test: {
          include: {
            questions: {
              include: {
                options: true
              }
            }
          }
        },
        responses: {
          include: {
            question: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    console.log('Found test results:', testResults.length)

    // Calculate max score for tests with 0 max score
    const updatedTestResults = await Promise.all(testResults.map(async (result) => {
      if (result.test.maxScore === 0) {
        const maxScore = result.test.questions.reduce((total, question) => {
          switch(question.type) {
            case 'SINGLE_CHOICE':
              // For single choice, take the highest positive score
              const maxSingleChoiceScore = Math.max(
                ...question.options
                  .filter(opt => (opt.score || 0) > 0)
                  .map(opt => opt.score || 0)
              )
              return total + maxSingleChoiceScore
            case 'MULTIPLE_CHOICE':
              // Sum of all positive option scores
              const multipleChoiceMaxScore = question.options
                .filter(opt => (opt.score || 0) > 0)
                .reduce((sum, opt) => sum + (opt.score || 0), 0)
              return total + multipleChoiceMaxScore
            case 'TEXT':
              // For text questions, you might want to set a manual max score
              // For now, defaulting to 0
              return total + 0
            default:
              return total
          }
        }, 0)

        // Update test with calculated max score
        await prisma.test.update({
          where: { id: result.test.id },
          data: { maxScore: Math.round(maxScore) }
        })

        // Update the result's test with new max score
        result.test.maxScore = Math.round(maxScore)
      }
      return result
    }))

    return NextResponse.json(updatedTestResults)
  } catch (error) {
    console.error('Fetching test results error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch test results',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
