import { QuestionOption } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { Prisma, PrismaClient } from "@prisma/client"
import {prisma} from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const testId = params.testId

    // Fetch the full test details including related data
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: {
            options: true
          }
        },
        testAssignments: {
          include: {
            group: {
              include: {
                groupStudentModels: true
              }
            }
          }
        }
      }
    })

    if (!test) {
      return new NextResponse('Test not found', { status: 404 })
    }

    // Extract students from all groups in test assignments
    const students = test.testAssignments.flatMap(
      assignment => assignment.group?.groupStudentModels || []
    )

    return NextResponse.json({
      ...test,
      students
    })
  } catch (error) {
    console.error('Error fetching test:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    // Await the params to resolve the NextJS warning
    const testId = params.testId

    // Parse the request body safely
    const body = await request.json()
    
    // Detailed payload logging
    console.log('Received update payload:', JSON.stringify(body, null, 2))

    // Validate the payload
    if (!body || typeof body !== 'object') {
      return new NextResponse('Invalid payload', { status: 400 })
    }

    const { title, description, questions, testAssignments } = body

    // Validate required fields
    if (!title) {
      return new NextResponse('Test title is required', { status: 400 })
    }

    // Validate question data
    if (!questions || !Array.isArray(questions)) {
      return new NextResponse('Invalid questions format', { status: 400 })
    }

    // Validate question types and structure
    questions.forEach((question, index) => {
      if (!question.text) {
        throw new Error(`Question ${index + 1} is missing text`)
      }
      
      if (!['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT'].includes(question.type)) {
        throw new Error(`Invalid question type for question ${index + 1}`)
      }

      if (question.type !== 'TEXT') {
        if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
          throw new Error(`Question ${index + 1} must have at least one option`)
        }

        question.options.forEach((opt: QuestionOption, optIndex: number) => {
          if (!opt.text) {
            throw new Error(`Option ${optIndex + 1} in question ${index + 1} is missing text`)
          }
        })
      }
    })

    // Update test and handle questions/options in a transaction
    const updatedTest = await prisma.$transaction(async (tx) => {
      // Update the test basic info
      const test = await tx.test.update({
        where: { id: testId },
        data: {
          title,
          description,
          // Remove all existing group assignments and create new ones
          testAssignments: {
            deleteMany: {},
            create: (testAssignments || []).map((groupId: string) => ({
              groupId
            }))
          }
        },
        include: {
          questions: {
            include: {
              options: true
            }
          },
          testAssignments: {
            include: {
              group: {
                include: {
                  groupStudentModels: true
                }
              }
            }
          }
        }
      })

      // Get existing question IDs from the database
      const existingQuestionIds = test.questions.map(q => q.id);
      
      // Identify question IDs to be deleted (those in existing questions but not in the new input)
      const questionIdsToDelete = existingQuestionIds.filter(
        existId => !questions.some(q => q.id === existId)
      );

      // Update existing questions and their options
      const updatedQuestions = await Promise.all(
        questions.map(async (question: { 
          id?: string; 
          text: string; 
          type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT'; 
          options?: Array<{ text: string; score?: number }> 
        }, index: number) => {
          if (question.id) {
            // Update existing question
            const updatedQuestion = await tx.question.update({
              where: { id: question.id },
              data: {
                text: question.text,
                type: question.type,
                order: index + 1,
                options: {
                  deleteMany: {},
                  create: question.type !== 'TEXT' ? (question.options || []).map((opt, optIndex) => ({
                    text: opt.text,
                    score: opt.score || 0,
                    order: optIndex + 1
                  })) : []
                }
              },
              include: {
                options: true
              }
            })
            return updatedQuestion
          } else {
            // Create new question
            return tx.question.create({
              data: {
                text: question.text,
                type: question.type,
                testId: test.id,
                order: index + 1,
                options: {
                  create: question.type !== 'TEXT' ? (question.options || []).map((opt, optIndex) => ({
                    text: opt.text,
                    score: opt.score || 0,
                    order: optIndex + 1
                  })) : []
                }
              },
              include: {
                options: true
              }
            })
          }
        })
      )

      // Delete questions that are no longer in the input
      if (questionIdsToDelete.length > 0) {
        // First, delete options for these questions
        await tx.questionOption.deleteMany({
          where: { 
            questionId: { in: questionIdsToDelete } 
          }
        })

        // Then delete the questions
        await tx.question.deleteMany({
          where: { 
            id: { in: questionIdsToDelete } 
          }
        })
      }

      return {
        ...test,
        questions: updatedQuestions,
        assignedGroups: test.testAssignments.map((ta: { group: { id: string } }) => ta.group.id),
        students: test.testAssignments.flatMap(
          assignment => assignment.group?.groupStudentModels || []
        )
      }
    }, {
      // Add explicit transaction options for more control
      isolationLevel: 'Serializable'
    })

    return NextResponse.json(updatedTest)
  } catch (error) {
    // More detailed error logging
    console.error('Detailed error during test update:', error)
    
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      return new NextResponse(error.message, { status: 500 })
    }
    
    return new NextResponse('Unexpected error occurred during test update', { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const testId = params.testId

    // Delete test in a transaction to handle related records
    const deletedTest = await prisma.$transaction(async (tx) => {
      // First, delete test assignments
      await tx.testAssignment.deleteMany({
        where: { testId }
      })

      // Delete test results
      await tx.testResult.deleteMany({
        where: { testId }
      })

      // Delete question options first
      await tx.questionOption.deleteMany({
        where: { question: { testId } }
      })

      // Delete questions
      await tx.question.deleteMany({
        where: { testId }
      })

      // Finally, delete the test
      return tx.test.delete({
        where: { id: testId }
      })
    })

    return NextResponse.json({ 
      message: 'Test deleted successfully', 
      deletedTest 
    }, { status: 200 })
  } catch (error) {
    console.error('Error deleting test:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
      if (error.code === 'P2025') {
        return new NextResponse('Test not found', { status: 404 })
      }
    }

    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
