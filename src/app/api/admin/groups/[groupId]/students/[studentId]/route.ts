import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest, 
  { params }: { params: { groupId: string, studentId: string } }
) {
  try {
    const data = await request.json()

    const updatedStudent = await prisma.student.update({
      where: { 
        id: params.studentId,
        groupId: params.groupId 
      },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || null
      }
    })

    return NextResponse.json(updatedStudent)
  } catch (error) {
    console.error('Ошибка обновления студента:', error)
    return NextResponse.json(
      { error: 'Не удалось обновить студента' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { groupId: string, studentId: string } }
) {
  try {
    await prisma.student.delete({
      where: { 
        id: params.studentId,
        groupId: params.groupId 
      }
    })

    return NextResponse.json({ message: 'Студент удален' })
  } catch (error) {
    console.error('Ошибка удаления студента:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить студента' }, 
      { status: 500 }
    )
  }
}
