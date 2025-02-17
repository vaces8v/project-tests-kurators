import { NextResponse } from 'next/server'
import { PrismaClient, UserRole } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: 'You must be logged in to view tests'
      }, { status: 401 })
    }

    // Fetch tests based on user role
    const tests = await prisma.test.findMany({
      where: session.user.role === 'ADMIN' ? {} : {
        authorId: session.user.id
      },
      include: {
        questions: {
          include: {
            options: true
          }
        },
        testAssignments: {
          include: {
            group: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true,
            minScore: true,
            maxScore: true,
            description: true
          }
        },
        learningStyleTest: {
          include: {
            questions: {
              include: {
                options: true
              },
              orderBy: {
                orderNumber: 'asc'
              }
            }
          }
        }
      }
    })

    // Transform tests to match frontend expectations
    const transformedTests = tests.map(test => ({
      id: test.id,
      title: test.title,
      description: test.description || '',
      questions: test.learningStyleTest 
        ? test.learningStyleTest.questions.map(q => ({
            id: q.id,
            text: q.text,
            type: 'SINGLE_CHOICE',
            options: q.options.map(opt => ({
              id: opt.id,
              text: opt.text,
              score: opt.column
            }))
          }))
        : test.questions,
      assignedGroups: test.testAssignments.map(
        assignment => assignment.group.code
      ),
      categories: test.categories
    }))

    return NextResponse.json(transformedTests)
  } catch (error) {
    console.error('Error fetching tests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tests', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
