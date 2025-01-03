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
        questions: true, // Включаем вопросы
        testAssignments: {
          include: {
            group: true // Включаем группы
          }
        }
      }
    })

    // Трансформируем тесты
    const transformedTests = tests.map(test => ({
      id: test.id,
      title: test.title,
      description: test.description || '',
      questions: test.questions, // Массив вопросов
      assignedGroups: test.testAssignments.map(
        assignment => assignment.group.code // Код группы
      )
    }))

    return NextResponse.json(transformedTests)
  } catch (error) {
    console.error('Error fetching tests:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch tests', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'CURATOR'].includes(session.user.role)) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: 'Only admin and curator users can create tests'
      }, { status: 403 })
    }

    // Detailed logging for debugging
    console.log('Session user:', session.user)

    // Detailed user verification with logging
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        name: true, 
        role: true,
        curatedGroups: {
          select: {
            id: true
          }
        }
      }
    })

    // If user not found in database but is admin/curator, create a placeholder
    if (!user && ['ADMIN', 'CURATOR'].includes(session.user.role)) {
      user = {
        id: session.user.id,
        name: session.user.name || 'User',
        role: session.user.role as UserRole,
        curatedGroups: []
      }
    }

    // If no user found and not admin/curator, throw unauthorized error
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found', 
        details: 'Unable to authenticate the current user'
      }, { status: 403 })
    }

    // More robust payload parsing
    let payload;
    try {
      const rawBody = await request.text()
      console.log('Raw request body:', rawBody) // Debug logging
      payload = JSON.parse(rawBody)
      console.log('Parsed payload:', payload) // Debug logging
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return NextResponse.json({ 
        error: 'Invalid JSON payload', 
        details: parseError instanceof Error ? parseError.message : 'Unable to parse request body'
      }, { status: 400 })
    }

    // Validate payload structure
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ 
        error: 'Invalid payload structure', 
        details: 'Payload must be a non-null object'
      }, { status: 400 })
    }

    const { title, description, questions, assignedGroups } = payload

    // Validate input
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ 
        error: 'Invalid title', 
        details: 'Title is required and must be a non-empty string'
      }, { status: 400 })
    }

    // Validate questions
    if (!Array.isArray(questions)) {
      return NextResponse.json({ 
        error: 'Invalid questions format', 
        details: 'Questions must be an array'
      }, { status: 400 })
    }

    // Validate assignedGroups
    if (assignedGroups && !Array.isArray(assignedGroups)) {
      return NextResponse.json({ 
        error: 'Invalid assignedGroups format', 
        details: 'Assigned groups must be an array'
      }, { status: 400 })
    }

    // Comprehensive group validation
    let validatedGroups: any[] = []
    if (assignedGroups && assignedGroups.length > 0) {
      // For curators, only allow assigning to their own groups
      const groupQuery = {
        where: session.user.role === 'CURATOR' 
          ? {
              id: { in: assignedGroups },
              curatorId: session.user.id
            }
          : {
              id: { in: assignedGroups }
            }
      }

      validatedGroups = await prisma.group.findMany({
        where: groupQuery.where,
        select: { 
          id: true, 
          name: true, 
          code: true,
          curator: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      const validGroupIds = validatedGroups.map(group => group.id)
      const invalidGroups = assignedGroups.filter((id: string) => !validGroupIds.includes(id))

      if (invalidGroups.length > 0) {
        return NextResponse.json({ 
          error: 'Invalid group IDs', 
          invalidGroups,
          details: `The following group IDs are invalid: ${invalidGroups.join(', ')}`,
          validGroups: validatedGroups
        }, { status: 400 })
      }
    }

    // Create test with questions and options using a transaction
    const test = await prisma.$transaction(async (prisma) => {
      // Create the test with comprehensive error handling
      let createdTest;
      try {
        createdTest = await prisma.test.create({
          data: {
            title,
            description: description || '',
            authorId: user.id,
            // Add group assignments
            testAssignments: assignedGroups && assignedGroups.length > 0 ? {
              create: assignedGroups.map((groupId: string) => ({
                groupId: groupId
              }))
            } : undefined
          }
        })
      } catch (createTestError) {
        console.error('Test creation error:', createTestError)
        throw new Error(`Failed to create test: ${createTestError instanceof Error ? createTestError.message : String(createTestError)}`)
      }

      // Create questions with detailed error handling
      const createdQuestions = await Promise.all(
        questions.map(async (q: any, qIndex: number) => {
          try {
            // Validate question structure
            if (!q.text || !q.type) {
              throw new Error(`Invalid question structure at index ${qIndex}`)
            }

            const createdQuestion = await prisma.question.create({
              data: {
                testId: createdTest.id,
                text: q.text,
                type: q.type,
                order: qIndex,
                options: {
                  create: q.options ? q.options.map((opt: any, optIndex: number) => ({
                    text: opt.text,
                    score: opt.score || 0,
                    order: optIndex
                  })) : []
                }
              }
            })

            return createdQuestion
          } catch (questionError) {
            console.error(`Error creating question at index ${qIndex}:`, questionError)
            throw questionError
          }
        })
      )

      return { ...createdTest, questions: createdQuestions }
    })

    return NextResponse.json(test, { status: 201 })
  } catch (error) {
    console.error('Test creation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create test', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
