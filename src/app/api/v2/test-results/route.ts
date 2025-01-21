import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface TestResponse {
  questionId: string;
  selectedOptions: string[];
}

interface ProcessedResponse {
  questionId: string;
  selectedOption: string;
  score: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      testId, 
      studentId, 
      responses 
    }: { 
      testId: string; 
      studentId: string; 
      responses: TestResponse[] 
    } = body

    // Validate input - both testId and studentId are required
    if (!testId || !studentId) {
      return NextResponse.json({ 
        error: 'Test ID and Student ID are required' 
      }, { status: 400 })
    }

    // Fetch test to get max possible score
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { 
        questions: { 
          include: { options: true } 
        } 
      }
    })

    if (!test) {
      return NextResponse.json({ 
        error: 'Test not found' 
      }, { status: 404 })
    }

    console.log('Test found:', {
      testId: test.id,
      questionCount: test.questions.length,
      questionIds: test.questions.map(q => q.id)
    })

    // Validate that all submitted questions belong to the test
    const submittedQuestionIds = new Set(responses.map(r => r.questionId))
    const testQuestionIds = new Set(test.questions.map(q => q.id))
    
    const invalidQuestions = [...submittedQuestionIds].filter(id => !testQuestionIds.has(id))
    if (invalidQuestions.length > 0) {
      return NextResponse.json({ 
        error: 'Invalid questions submitted',
        details: `The following questions do not belong to this test: ${invalidQuestions.join(', ')}. This may happen if the test was updated while you were taking it. Please refresh the page and try again.`
      }, { status: 400 })
    }

    // Calculate total score and validate responses first
    let totalScore = 0
    console.log('Processing responses:', responses.map(r => r.questionId))
    
    const processedResponses = responses.map((response: TestResponse) => {
      const question = test.questions.find(q => q.id === response.questionId)
      
      if (!question) {
        console.log('Question not found:', {
          searchedId: response.questionId,
          availableIds: test.questions.map(q => q.id)
        })
        throw new Error(`Question ${response.questionId} not found`)
      }

      let score = 0
      let selectedOption = ''

      if (question.type === 'TEXT') {
        selectedOption = response.selectedOptions[0] || ''
      } else if (question.type === 'SINGLE_CHOICE') {
        const selectedOptionId = response.selectedOptions[0]
        if (!selectedOptionId) {
          throw new Error(`No option selected for question ${question.id}`)
        }
        const option = question.options.find(opt => opt.id === selectedOptionId)
        if (!option) {
          throw new Error(`Option ${selectedOptionId} not found for question ${question.id}`)
        }
        score = option.score
        selectedOption = option.id
      } else if (question.type === 'MULTIPLE_CHOICE') {
        score = response.selectedOptions
          .reduce((total: number, optionId: string) => {
            const option = question.options.find(opt => opt.id === optionId)
            return total + (option ? option.score : 0)
          }, 0)
        selectedOption = response.selectedOptions.join(',')
      }

      totalScore += score

      return {
        questionId: question.id,
        selectedOption,
        score
      }
    })

    try {
      // Create test result
      const testResult = await prisma.$transaction(async (tx) => {
        // Create test result record
        const result = await tx.testResult.create({
          data: {
            totalScore,
            test: {
              connect: { id: testId }
            },
            student: {
              connect: { id: studentId }
            }
          }
        })

        // Create test responses
        await Promise.all(processedResponses.map((response: ProcessedResponse) => 
          tx.testResponse.create({
            data: {
              testResult: { connect: { id: result.id } },
              question: { connect: { id: response.questionId } },
              selectedOption: response.selectedOption,
              score: response.score
            }
          })
        ))

        return result
      })

      return NextResponse.json(testResult, { status: 201 })
    } catch (error) {
      console.error('Transaction error:', error)
      return NextResponse.json({ 
        error: 'Failed to save test results',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Request error:', error)
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const testId = searchParams.get('testId')

    const whereCondition: any = {}
    if (groupId) {
      whereCondition.student = {
        groupId: groupId
      }
    }
    if (testId) {
      whereCondition.testId = testId
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
      },
      orderBy: {
        totalScore: 'desc'
      }
    })

    // Calculate group statistics
    const stats = {
      totalStudents: testResults.length,
      averageScore: testResults.length 
        ? testResults.reduce((sum, r) => sum + r.totalScore, 0) / testResults.length 
        : 0,
      highestScore: testResults.length 
        ? Math.max(...testResults.map(r => r.totalScore)) 
        : 0,
      lowestScore: testResults.length 
        ? Math.min(...testResults.map(r => r.totalScore)) 
        : 0
    }

    return NextResponse.json({ results: testResults, stats })
  } catch (error) {
    console.error('Test results fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch test results',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
