import { NextResponse } from 'next/server'
import { PrismaClient, LearningStyle } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// Get available tests for a student's groups
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const uniqueLink = searchParams.get('uniqueLink')

  const session = await getServerSession(authOptions)
  
  // Ensure only students can access tests
  if (!session || session.user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // If unique link is provided, fetch specific test details
  if (uniqueLink) {
    const testAssignment = await prisma.testAssignment.findUnique({
      where: { uniqueLink },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            questions: {
              select: {
                id: true,
                text: true,
                type: true,
                options: true
              }
            }
          }
        }
      }
    })

    if (!testAssignment) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    return NextResponse.json(testAssignment)
  }

  // Otherwise, find groups the student belongs to and get available tests
  const groups = await prisma.group.findMany({
    where: { 
      testAssignments: { 
        some: {} 
      } 
    },
    select: { id: true }
  })

  // Get test assignments for these groups
  const testAssignments = await prisma.testAssignment.findMany({
    where: { 
      groupId: { in: groups.map(g => g.id) } 
    },
    include: {
      test: {
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          questions: {
            select: {
              id: true,
              text: true,
              type: true,
              options: true
            }
          }
        }
      }
    }
  })

  return NextResponse.json(testAssignments)
}

// Submit test results without authentication
export async function POST(request: Request) {
  try {
    const { 
      testId, 
      groupId, 
      studentName, 
      answers, 
      learningStyleQuiz 
    } = await request.json()

    // Validate test assignment exists
    const testAssignment = await prisma.testAssignment.findFirst({
      where: { 
        testId, 
        groupId,
        uniqueLink: { not: undefined }
      }
    })

    if (!testAssignment) {
      return NextResponse.json({ error: 'Invalid test assignment' }, { status: 400 })
    }

    // Calculate total score
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    let totalScore = 0
    const maxScore = test.questions.reduce((sum, q) => sum + q.points, 0)

    test.questions.forEach(question => {
      const studentAnswer = answers[question.id]
      
      // Score calculation logic
      if (question.type === 'multiple-choice') {
        if (studentAnswer === question.correctAnswer) {
          totalScore += question.points
        }
      } else if (question.type === 'boolean') {
        if (studentAnswer === question.correctAnswer) {
          totalScore += question.points
        }
      }
      // For text questions, manual grading would be needed
    })

    // Determine learning style
    const learningStyleResult = determineLearningStyle(learningStyleQuiz)

    // Save test result
    const testResult = await prisma.testResult.create({
      data: {
        test: { connect: { id: testId } },
        group: { connect: { id: groupId } },
        studentName,
        answers,
        totalScore,
        maxScore,
        learningStyle: learningStyleResult.style,
        learningStyleRecommendation: learningStyleResult.recommendation
      }
    })

    return NextResponse.json(testResult, { status: 201 })
  } catch (error) {
    console.error('Test submission error:', error)
    return NextResponse.json({ error: 'Test submission failed' }, { status: 500 })
  }
}

// Learning style determination function
function determineLearningStyle(quizAnswers: any): { 
  style: LearningStyle, 
  recommendation: string 
} {
  // Simple learning style quiz logic
  const scores = {
    VISUAL: 0,
    AUDITORY: 0,
    KINESTHETIC: 0,
    READING_WRITING: 0
  }

  // Example scoring logic (you'd replace this with actual quiz logic)
  Object.entries(quizAnswers || {}).forEach(([question, answer]) => {
    switch (answer) {
      case 'VISUAL':
        scores.VISUAL += 1
        break
      case 'AUDITORY':
        scores.AUDITORY += 1
        break
      case 'KINESTHETIC':
        scores.KINESTHETIC += 1
        break
      case 'READING_WRITING':
        scores.READING_WRITING += 1
        break
    }
  })

  // Find the highest scoring style
  const style = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0] as LearningStyle

  // Generate recommendation based on learning style
  const recommendations = {
    VISUAL: 'Use diagrams, charts, and visual aids to enhance learning.',
    AUDITORY: 'Utilize audio recordings, discussions, and verbal explanations.',
    KINESTHETIC: 'Engage in hands-on activities and practical demonstrations.',
    READING_WRITING: 'Focus on textbooks, note-taking, and written materials.'
  }

  return {
    style,
    recommendation: recommendations[style]
  }
}
