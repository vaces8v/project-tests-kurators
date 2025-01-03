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
          },
          orderBy: {
            order: 'asc' // Сортировка вопросов по порядку
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

    // Трансформируем данные для соответствия требованиям
    const transformedTest = {
      ...test,
      questions: test.questions, // Теперь это массив вопросов
      assignedGroups: test.testAssignments.map(
        assignment => assignment.group.code // Возвращаем код группы
      ),
      students
    }

    return NextResponse.json(transformedTest)
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
    const testId = params.testId

    // Parse the request body safely
    const body = await request.json()
    
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

    // Comprehensive question validation
    const validateQuestions = (questions: any[]) => {
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i]
        
        // Validate question type
        if (!question.type) {
          throw new Error(`Question ${i + 1} is missing a type`)
        }

        // Validate options for non-TEXT questions
        if (question.type !== 'TEXT') {
          if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
            throw new Error(`Question ${i + 1} must have at least one option`)
          }

          // Validate each option
          question.options.forEach((opt: any, optIndex: number) => {
            if (!opt.text) {
              throw new Error(`Option ${optIndex + 1} in question ${i + 1} must have a text`)
            }
            // Ensure score is a number
            opt.score = opt.score !== undefined ? Number(opt.score) : 0
          })
        }
      }
      return questions
    }

    // Validate and process questions
    const processedQuestions = validateQuestions(questions)

    // Находим группы по их кодам
    let validatedGroups: string[] = []
    if (testAssignments && testAssignments.length > 0) {
      // Debug logging
      console.log('Received test assignments:', testAssignments)

      // Check if the assignments are group codes or group IDs
      const groups = await prisma.group.findMany({
        where: {
          OR: [
            { code: { in: testAssignments } },  // Match by group codes
            { id: { in: testAssignments } }     // Match by group IDs
          ]
        },
        select: { id: true, code: true }
      })

      // Debug logging
      console.log('Found groups:', groups)

      // Validate that all provided assignments match either codes or IDs
      if (groups.length !== testAssignments.length) {
        // Find which assignments are invalid
        const validGroupCodesAndIds = new Set(groups.map(g => g.code).concat(groups.map(g => g.id)))
        const invalidAssignments = testAssignments.filter((assignment: string) => 
          !validGroupCodesAndIds.has(assignment)
        )

        // Debug logging
        console.log('Valid group codes and IDs:', Array.from(validGroupCodesAndIds))
        console.log('Invalid assignments:', invalidAssignments)

        return new NextResponse(`Invalid group assignments: ${invalidAssignments.join(', ')}`, { status: 400 })
      }

      validatedGroups = groups.map(group => group.id)
    }

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
            create: validatedGroups.map(groupId => ({
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
              group: true
            }
          }
        }
      })

      // Get existing question IDs from the database
      const existingQuestionIds = test.questions.map(q => q.id);
      
      // Identify question IDs to be deleted (those in existing questions but not in the new input)
      const questionIdsToDelete = existingQuestionIds.filter(
        existId => !processedQuestions.some(q => q.id === existId)
      );

      // Update existing questions and their options
      const updatedQuestions = await Promise.all(
        processedQuestions.map(async (question, index) => {
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
                  create: question.type !== 'TEXT' ? question.options.map((opt: QuestionOption, optIndex: number) => ({
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
                  create: question.type !== 'TEXT' ? question.options.map((opt: QuestionOption, optIndex: number) => ({
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

      // Трансформируем результат
      return {
        ...test,
        questions: updatedQuestions,
        assignedGroups: test.testAssignments.map(
          assignment => assignment.group.code
        )
      }
    }, {
      isolationLevel: 'Serializable'
    })

    return NextResponse.json(updatedTest)
  } catch (error) {
    console.error('Detailed error during test update:', error)
    
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      // Log the full error object for more details
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
      
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
