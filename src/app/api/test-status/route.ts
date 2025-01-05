import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { studentId, testId, status } = await req.json()

    // Проверяем, существует ли уже назначение теста для студента
    const existingAssignment = await prisma.testAssignment.findFirst({
      where: {
        studentId,
        testId
      }
    })

    if (existingAssignment) {
      // Обновляем статус существующего назначения
      await prisma.testAssignment.update({
        where: { id: existingAssignment.id },
        data: { status }
      })
    } else {
      // Создаем новое назначение теста, если его нет
      await prisma.testAssignment.create({
        data: {
          studentId,
          testId,
          status,
          // Предполагаем, что группа определяется автоматически
          groupId: (await prisma.student.findUnique({
            where: { id: studentId },
            select: { groupId: true }
          }))?.groupId || '' // Provide an empty string as default if groupId is undefined
        }
      })
    }

    return NextResponse.json({ message: 'Test status updated successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error updating test status:', error)
    return NextResponse.json({ error: 'Failed to update test status' }, { status: 500 })
  }
}
