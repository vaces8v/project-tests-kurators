import { NextResponse } from 'next/server'
import { PrismaClient, LearningStyle } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// Get available tests for a student's groups
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const uniqueLink = searchParams.get('uniqueLink')

  // If unique link is provided, fetch specific test details without requiring auth
  if (uniqueLink) {
    const testLink = await prisma.testLink.findUnique({
      where: { 
        linkId: uniqueLink,
        expiresAt: {
          gt: new Date() // Check if link hasn't expired
        }
      },
      include: {
        test: {
          include: {
            testAssignments: {
              include: {
                group: {
                  include: {
                    groupStudentModels: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        middleName: true
                      }
                    }
                  }
                }
              }
            },
            questions: {
              select: {
                id: true,
                text: true,
                type: true,
                options: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    })

    if (!testLink || !testLink.test) {
      return NextResponse.json({ error: 'Invalid or expired test link' }, { status: 404 })
    }

    // Собираем всех уникальных студентов из всех групп
    const allStudents = await Promise.all(
      testLink.test.testAssignments
        .flatMap(assignment => assignment.group?.groupStudentModels || [])
        .filter((student, index, self) => 
          index === self.findIndex((s) => s.id === student.id)
        )
        .map(async (student) => {
          // Check if the student has already completed this test
          const testResult = await prisma.testResult.findFirst({
            where: {
              studentId: student.id,
              testId: testLink.test.id
            }
          })
          
          // Return the student only if they haven't completed the test
          return testResult ? null : student
        })
    )
    // Remove null values (students who completed the test)
    .then(students => students.filter(student => student !== null));

    return NextResponse.json({
      test: {
        id: testLink.test.id,
        title: testLink.test.title,
        description: testLink.test.description,
        questions: testLink.test.questions || []
      },
      students: allStudents
    })
  }

  // For non-link access, require student authentication
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
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

// Define interface for student answer
interface StudentAnswer {
  questionId: string;
  selectedOption: string;
  score: number;
}

// Submit test results without authentication
export async function POST(request: Request) {
  try {
    const { 
      testId, 
      groupId, 
      studentId, 
      answers, 
      learningStyleQuiz 
    } = await request.json()

    // Validate test assignment exists
    const testAssignment = await prisma.testAssignment.findFirst({
      where: { 
        testId, 
        groupId
      }
    })

    if (!testAssignment) {
      return NextResponse.json({ error: 'Invalid test assignment' }, { status: 400 })
    }

    // Calculate total score
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { 
        questions: {
          include: {
            options: true
          }
        } 
      }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    let totalScore = 0
    const maxScore = test.questions.reduce((sum, q) => {
      // For each question, find the maximum possible score from its options
      const questionMaxScore = Math.max(...q.options.map(opt => opt.score), 0)
      return sum + questionMaxScore
    }, 0)

    test.questions.forEach(question => {
      const studentAnswer = answers.find((answer: StudentAnswer) => answer.questionId === question.id)
      
      // Score calculation logic
      if (question.type === 'MULTIPLE_CHOICE') {
        const correctOption = question.options.find(option => option.score > 0)
        if (correctOption && studentAnswer.selectedOption === correctOption.text) {
          totalScore += correctOption.score
        }
      } else if (question.type === 'SINGLE_CHOICE') {
        const correctOption = question.options.find(option => option.score > 0)
        if (correctOption && studentAnswer.selectedOption === correctOption.text) {
          totalScore += correctOption.score
        }
      }
    })

    // Determine learning style
    const learningStyleResult = determineLearningStyle(learningStyleQuiz)

    // Save test result
    const testResult = await prisma.testResult.create({
      data: {
        test: { connect: { id: testId } },
        student: { connect: { id: studentId } },
        totalScore,
        responses: {
          create: answers.map((answer: StudentAnswer) => ({
            question: { connect: { id: answer.questionId } },
            selectedOption: answer.selectedOption,
            score: answer.score
          }))
        },
        learningStyleResult: {
          create: {
            concreteExpScore: learningStyleResult.concreteExpScore,
            reflectiveScore: learningStyleResult.reflectiveScore,
            theoreticalScore: learningStyleResult.theoreticalScore,
            activeExpScore: learningStyleResult.activeExpScore,
            test: {
              connect: {
                id: testId
              }
            }
          }
        }
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
  concreteExpScore: number,
  reflectiveScore: number,
  theoreticalScore: number,
  activeExpScore: number
} {
  // Simple learning style quiz logic
  const scores = {
    CONCRETE_EXP: 0,
    REFLECTIVE: 0,
    THEORETICAL: 0,
    ACTIVE_EXP: 0
  }

  // Example scoring logic (you'd replace this with actual quiz logic)
  Object.entries(quizAnswers || {}).forEach(([question, answer]) => {
    switch (answer) {
      case 'CONCRETE_EXP':
        scores.CONCRETE_EXP += 1
        break
      case 'REFLECTIVE':
        scores.REFLECTIVE += 1
        break
      case 'THEORETICAL':
        scores.THEORETICAL += 1
        break
      case 'ACTIVE_EXP':
        scores.ACTIVE_EXP += 1
        break
    }
  })

  // Find the highest scoring style
  const style = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0]

  // Generate recommendation based on learning style
  const recommendations = {
    CONCRETE_EXP: 'Use hands-on activities and practical demonstrations.',
    REFLECTIVE: 'Utilize self-assessment and reflective journaling.',
    THEORETICAL: 'Focus on theoretical foundations and conceptual understanding.',
    ACTIVE_EXP: 'Engage in active experimentation and exploration.'
  }

  return {
    concreteExpScore: scores.CONCRETE_EXP,
    reflectiveScore: scores.REFLECTIVE,
    theoreticalScore: scores.THEORETICAL,
    activeExpScore: scores.ACTIVE_EXP
  }
}
