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
        categories: true
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

      // 4. Create new group assignments
      if (assignedGroups?.length > 0) {
        // First find the groups by their codes
        const groupsToAssign = await tx.group.findMany({
          where: {
            code: {
              in: assignedGroups
            }
          }
        });

        if (groupsToAssign.length > 0) {
          await tx.testAssignment.createMany({
            data: groupsToAssign.map(group => ({
              testId,
              groupId: group.id
            }))
          });
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

    // First delete all related records
    await prisma.$transaction([
      // Delete test assignments
      prisma.testAssignment.deleteMany({
        where: { testId },
      }),
      // Delete questions and their options
      prisma.questionOption.deleteMany({
        where: {
          question: {
            testId,
          },
        },
      }),
      prisma.question.deleteMany({
        where: { testId },
      }),
      // Finally delete the test
      prisma.test.delete({
        where: { id: testId },
      }),
    ])

    return NextResponse.json({ message: 'Test deleted successfully' })
  } catch (error) {
    console.error('Error deleting test:', error)
    return NextResponse.json(
      { error: 'Failed to delete test', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
