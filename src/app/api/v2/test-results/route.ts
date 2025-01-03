import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      testId, 
      studentId, 
      responses 
    } = body

    // Validate input
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

    // Calculate total score
    let totalScore = 0

    // Create test result
    const testResult = await prisma.$transaction(async (tx) => {
      // Create test result record
      const result = await tx.testResult.create({
        data: {
          test: { connect: { id: testId } },
          student: { connect: { id: studentId } },
          totalScore: 0, // Temporary, will update later
        }
      })

      // Process and save responses
      const testResponses = await Promise.all(responses.map(async (response: any) => {
        const question = test.questions.find(q => q.id === response.questionId)
        
        if (!question) {
          throw new Error(`Question ${response.questionId} not found`)
        }

        let score = 0
        let selectedOption = null

        if (question.type === 'TEXT') {
          // For text questions, manually score later
          selectedOption = response.selectedOptions[0]
        } else if (question.type === 'SINGLE_CHOICE') {
          // Find the selected option
          const option = question.options.find(opt => opt.id === response.selectedOptions[0])
          if (option) {
            score = option.score
            selectedOption = option.id
          }
        } else if (question.type === 'MULTIPLE_CHOICE') {
          // Sum scores for selected options
          score = response.selectedOptions
            .reduce((total: number, optionId: string) => {
              const option = question.options.find(opt => opt.id === optionId)
              return total + (option ? option.score : 0)
            }, 0)
          
          selectedOption = JSON.stringify(response.selectedOptions)
        }

        totalScore += score

        // Create test response
        return tx.testResponse.create({
          data: {
            testResult: { connect: { id: result.id } },
            question: { connect: { id: question.id } },
            selectedOption: selectedOption,
            score: score
          }
        })
      }))

      // Update total score
      await tx.testResult.update({
        where: { id: result.id },
        data: { totalScore }
      })

      return result
    })

    return NextResponse.json(testResult, { status: 201 })
  } catch (error) {
    console.error('Test result submission error:', error)
    return NextResponse.json({ 
      error: 'Test result submission failed',
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
