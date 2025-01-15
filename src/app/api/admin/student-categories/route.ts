import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.studentCategory.findMany({
      orderBy: { minScore: 'asc' },
      include: {
        tests: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Ошибка получения категорий:', error)
    return NextResponse.json({ error: 'Не удалось получить категории' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testIds, ...data } = await request.json()
    
    // Валидация входных данных
    if (!data.name || typeof data.minScore !== 'number' || typeof data.maxScore !== 'number') {
      return NextResponse.json({ error: 'Некорректные данные категории' }, { status: 400 })
    }

    // First create the category without tests
    const newCategory = await prisma.studentCategory.create({ 
      data: {
        ...data,
      },
    })

    // Then connect tests if provided
    if (testIds && testIds.length > 0) {
      await prisma.studentCategory.update({
        where: { id: newCategory.id },
        data: {
          tests: {
            connect: testIds.map((testId: string) => ({ id: testId })),
          },
        },
      })
    }

    // Finally fetch the category with its relationships
    const categoryWithTests = await prisma.studentCategory.findUnique({
      where: { id: newCategory.id },
      include: {
        tests: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(categoryWithTests, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания категории:', error)
    return NextResponse.json({ error: 'Не удалось создать категорию' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, testIds, ...updateData } = await request.json()
    
    // Валидация входных данных
    if (!id) {
      return NextResponse.json({ error: 'Требуется идентификатор категории' }, { status: 400 })
    }

    // First update basic category data and clear test relationships
    await prisma.studentCategory.update({
      where: { id },
      data: {
        ...updateData,
        tests: {
          set: [], // Clear existing relationships
        },
      },
    })

    // Then connect new tests if provided
    if (testIds && testIds.length > 0) {
      await prisma.studentCategory.update({
        where: { id },
        data: {
          tests: {
            connect: testIds.map((testId: string) => ({ id: testId })),
          },
        },
      })
    }

    // Finally fetch the updated category with relationships
    const updatedCategory = await prisma.studentCategory.findUnique({
      where: { id },
      include: {
        tests: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Ошибка обновления категории:', error)
    return NextResponse.json({ error: 'Не удалось обновить категорию' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Требуется идентификатор категории' }, { status: 400 })
    }

    // First disconnect all test relationships
    await prisma.studentCategory.update({
      where: { id },
      data: {
        tests: {
          set: [], // Clear all relationships
        },
      },
    })

    // Then delete the category
    await prisma.studentCategory.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Категория успешно удалена' })
  } catch (error) {
    console.error('Ошибка удаления категории:', error)
    return NextResponse.json({ error: 'Не удалось удалить категорию' }, { status: 500 })
  }
}
