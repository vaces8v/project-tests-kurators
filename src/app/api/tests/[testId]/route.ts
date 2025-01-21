import { QuestionOption, Question } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { Prisma, PrismaClient } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const testId = params.testId
    
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: {
            options: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        testAssignments: {
          include: {
            group: true
          }
        },
        categories: true,
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

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...test,
      assignedGroups: test.testAssignments.map(ta => ta.group.code),
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
        : test.questions.map(q => ({
            ...q,
            options: q.options || []
          }))
    })
  } catch (error) {
    console.error('Error fetching test:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const testId = params.testId
    const body = await request.json()
    console.log('Updating test with data:', JSON.stringify(body, null, 2))

    const { title, description, questions, assignedGroups, categories } = body

    // Start transaction to ensure all operations are atomic
    const updatedTest = await prisma.$transaction(async (tx) => {
      // 1. Update basic test information
      const testUpdate = await tx.test.update({
        where: { id: testId },
        data: {
          title,
          description,
          // Remove existing test assignments
          testAssignments: {
            deleteMany: {}
          },
          categories: categories?.length > 0 ? {
            set: categories.map((cat: any) => ({ id: cat.id }))
          } : {
            set: []
          }
        }
      })

      // 2. Delete existing questions and their options
      await tx.questionOption.deleteMany({
        where: {
          question: {
            testId
          }
        }
      })
      await tx.question.deleteMany({
        where: { testId }
      })

      // 3. Create new questions and options
      if (questions?.length > 0) {
        for (const question of questions) {
          const createdQuestion = await tx.question.create({
            data: {
              testId,
              text: question.text,
              type: question.type,
              order: question.order || 1
            }
          })

          if (question.type !== 'TEXT' && question.options?.length > 0) {
            await tx.questionOption.createMany({
              data: question.options.map((opt: any, index: number) => ({
                questionId: createdQuestion.id,
                text: opt.text,
                score: opt.score || 0,
                order: index + 1
              }))
            })
          }
        }
      }

      // 4. Create new group assignments (with error handling)
      if (assignedGroups?.length > 0) {
        try {
          // First find the groups by their codes
          const groupsToAssign = await tx.group.findMany({
            where: {
              code: {
                in: assignedGroups
              }
            }
          });

          if (groupsToAssign.length > 0) {
            // Safely create test assignments
            await tx.testAssignment.createMany({
              data: groupsToAssign.map(group => ({
                testId,
                groupId: group.id
              })),
              skipDuplicates: true  // Prevent duplicate assignments
            });
          } else {
            console.warn(`No groups found for codes: ${assignedGroups.join(', ')}`)
          }
        } catch (assignmentError) {
          console.error('Error creating test assignments:', assignmentError)
          // Log the error but continue with the transaction
        }
      }

      // 6. Return the updated test with all relationships
      return await tx.test.findUnique({
        where: { id: testId },
        include: {
          questions: {
            include: {
              options: true
            },
            orderBy: {
              order: 'asc'
            }
          },
          testAssignments: {
            include: {
              group: true
            }
          },
          categories: true
        }
      })
    })

    if (!updatedTest) {
      return NextResponse.json(
        { error: 'Failed to update test' }, 
        { status: 404 }
      )
    }

    return NextResponse.json(updatedTest)
  } catch (error) {
    console.error('Error updating test:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update test', 
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const testId = params.testId
    
    // Validate testId
    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' }, 
        { status: 400 }
      )
    }

    // Check if test exists before attempting deletion
    const existingTest = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        testAssignments: true,
        questions: true,
        learningStyleTest: true,
        testResults: true,
        testLinks: true
      }
    })

    if (!existingTest) {
      return NextResponse.json(
        { error: 'Test not found', details: `No test found with ID: ${testId}` }, 
        { status: 404 }
      )
    }

    // Perform deletion in a transaction with cascading delete
    const deletedTest = await prisma.$transaction(async (tx) => {
      // 1. Force delete all test assignments
      await tx.testAssignment.deleteMany({
        where: { testId: existingTest.id }
      })

      // 2. Delete test results and their responses
      const testResultIds = existingTest.testResults.map(tr => tr.id)
      await tx.testResponse.deleteMany({
        where: { testResultId: { in: testResultIds } }
      })
      await tx.testResult.deleteMany({
        where: { testId: existingTest.id }
      })

      // 3. Delete test links
      await tx.testLink.deleteMany({
        where: { testId: existingTest.id }
      })

      // 4. Delete question options
      await tx.questionOption.deleteMany({
        where: { question: { testId: existingTest.id } }
      })

      // 5. Delete questions
      await tx.question.deleteMany({
        where: { testId: existingTest.id }
      })

      // 6. Delete learning style test components if exists
      if (existingTest.learningStyleTest) {
        await tx.learningStyleResponse.deleteMany({
          where: { 
            result: { 
              testId: existingTest.learningStyleTest.id 
            } 
          }
        })
        await tx.learningStyleResult.deleteMany({
          where: { test: { id: existingTest.learningStyleTest.id } }
        })
        await tx.learningStyleOption.deleteMany({
          where: { 
            question: { 
              testId: existingTest.learningStyleTest.id 
            } 
          }
        })
        await tx.learningStyleQuestion.deleteMany({
          where: { testId: existingTest.learningStyleTest.id }
        })
        await tx.learningStyleTest.deleteMany({
          where: { testId: existingTest.id }
        })
      }

      // 7. Finally delete the test
      return await tx.test.delete({
        where: { id: testId }
      })
    })

    return NextResponse.json({ 
      message: 'Test deleted successfully', 
      deletedTest: {
        id: deletedTest.id,
        title: deletedTest.title,
        deletedAssignments: existingTest.testAssignments.length,
        deletedResults: existingTest.testResults.length
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Error deleting test:', error)
    
    // More specific error handling
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle known Prisma errors
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Test not found or already deleted', details: error.message }, 
          { status: 404 }
        )
      }
      
      // Handle foreign key constraint errors
      if (error.code === 'P2003') {
        return NextResponse.json(
          { 
            error: 'Cannot delete test due to existing dependencies', 
            details: 'The test is still referenced by other records' 
          }, 
          { status: 400 }
        )
      }
    }

    // Generic error handling
    return NextResponse.json(
      { 
        error: 'Failed to delete test', 
        details: error instanceof Error ? error.message : 'Unknown error occurred' 
      }, 
      { status: 500 }
    )
  }
}
