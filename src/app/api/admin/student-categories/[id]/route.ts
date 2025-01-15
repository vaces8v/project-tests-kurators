import { NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { testIds, ...data } = await request.json();

    // First update the basic category data
    const updatedCategory = await prisma.studentCategory.update({
      where: {
        id: id,
      },
      data: {
        name: data.name,
        minScore: data.minScore,
        maxScore: data.maxScore,
        description: data.description,
        tests: {
          set: [], // Clear existing relationships
        },
      },
    });

    // Then update test relationships if testIds are provided
    if (testIds && testIds.length > 0) {
      await prisma.studentCategory.update({
        where: {
          id: id,
        },
        data: {
          tests: {
            connect: testIds.map((testId: string) => ({ id: testId })),
          },
        },
      });
    }

    // Finally fetch the updated category with all its relationships
    const categoryWithTests = await prisma.studentCategory.findUnique({
      where: {
        id: id,
      },
      include: {
        tests: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(categoryWithTests);
  } catch (error) {
    console.error('Error updating student category:', error);
    return NextResponse.json(
      { error: 'Failed to update student category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // First disconnect all test relationships
    await prisma.studentCategory.update({
      where: { id },
      data: {
        tests: {
          set: [], // Clear all relationships
        },
      },
    });

    // Then delete the category
    await prisma.studentCategory.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Student category deleted successfully' });
  } catch (error) {
    console.error('Error deleting student category:', error);
    return NextResponse.json(
      { error: 'Failed to delete student category' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const category = await prisma.studentCategory.findUnique({
      where: {
        id: id,
      },
      include: {
        tests: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Student category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching student category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student category' },
      { status: 500 }
    );
  }
}
