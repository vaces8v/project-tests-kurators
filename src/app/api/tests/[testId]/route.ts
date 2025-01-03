import { QuestionOption, Question } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { Prisma, PrismaClient } from "@prisma/client"
import {prisma} from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  const testId = params.testId

  try {
    // Fetch the full test details including related data
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
        }
      }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...test,
      assignedGroups: test.testAssignments.map(ta => ta.group.code),
      questions: test.questions.map(q => ({
        ...q,
        options: q.type !== 'TEXT' ? q.options : []
      }))
    })
  } catch (error) {
    console.error('Error fetching test:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : 'No additional details',
        type: error ? error.constructor.name : 'Unknown error type'
      }, 
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  const testId = params.testId
  const body = await request.json()

  try {
    const updatedTest = await prisma.$transaction(async (tx) => {
      // Update test metadata
      const test = await tx.test.update({
        where: { id: testId },
        data: {
          title: body.title,
          description: body.description || null
        }
      })

      // Manage test assignments (groups)
      if (body.assignedGroups && body.assignedGroups.length > 0) {
        // First, delete existing assignments
        await tx.testAssignment.deleteMany({
          where: { testId }
        })

        // Find group IDs based on group codes
        const groups = await tx.group.findMany({
          where: { code: { in: body.assignedGroups } }
        })

        // Create new assignments
        await tx.testAssignment.createMany({
          data: groups.map(group => ({
            testId,
            groupId: group.id
          }))
        })
      } else {
        // If no groups are provided, explicitly remove all existing assignments
        await tx.testAssignment.deleteMany({
          where: { testId }
        })
      }

      // Manage questions
      const existingQuestions = await tx.question.findMany({
        where: { testId },
        include: { options: true }
      })

      // Track question IDs to identify deletions
      const incomingQuestionIds = body.questions
        .filter((q: any) => q.id)
        .map((q: any) => q.id)

      // Delete questions not in the incoming list
      const questionsToDelete = existingQuestions
        .filter(eq => !incomingQuestionIds.includes(eq.id))

      for (const questionToDelete of questionsToDelete) {
        await tx.questionOption.deleteMany({
          where: { questionId: questionToDelete.id }
        })
        await tx.question.delete({
          where: { id: questionToDelete.id }
        })
      }

      // Update or create questions
      const updatedQuestions = await Promise.all(body.questions.map(async (questionData: any) => {
        const questionPayload = {
          testId,
          text: questionData.text,
          type: questionData.type,
          order: questionData.order || 0
        }

        let question;
        if (questionData.id) {
          // Update existing question
          question = await tx.question.update({
            where: { id: questionData.id },
            data: questionPayload
          })
        } else {
          // Create new question
          question = await tx.question.create({
            data: questionPayload
          })
        }

        // Manage question options
        if (questionData.type !== 'TEXT' && questionData.options) {
          // Delete existing options
          await tx.questionOption.deleteMany({
            where: { questionId: question.id }
          })

          // Create new options
          await tx.questionOption.createMany({
            data: questionData.options.map((opt: any, index: number) => ({
              questionId: question.id,
              text: opt.text,
              score: opt.score || 0,
              order: index + 1
            }))
          })
        }

        return question
      }))

      // Fetch and return the complete updated test
      return await tx.test.findUnique({
        where: { id: testId },
        include: {
          questions: {
            include: { options: true },
            orderBy: { order: 'asc' }
          },
          testAssignments: {
            include: { group: true }
          }
        }
      })
    })

    return NextResponse.json({
      ...updatedTest,
      assignedGroups: updatedTest?.testAssignments.map(ta => ta.group.code),
      questions: updatedTest?.questions.map(q => ({
        ...q,
        options: q.type !== 'TEXT' ? q.options : []
      }))
    }, { status: 200 })
  } catch (error) {
    console.error('Error updating test:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : 'No additional details',
        type: error ? error.constructor.name : 'Unknown error type'
      }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  const testId = params.testId

  try {
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
    console.error('Error type:', typeof error)
    console.error('Error constructor:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
      if (error.code === 'P2025') {
        return new NextResponse('Test not found', { status: 404 })
      }
    }

    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
