import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest, 
  context: { params: { groupId: string } }
) {
  try {
    const group = await prisma.group.findUnique({
      where: { id: context.params.groupId },
      include: {
        curator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Группа не найдена' }, 
        { status: 404 }
      );
    }

    // Ensure curator is always an object with default values
    return NextResponse.json({
      ...group,
      curator: group.curator || {
        id: null,
        name: 'Куратор не назначен',
        email: '',
        role: 'curator'
      }
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Не удалось получить информацию о группе' }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest, 
  context: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const groupId = context.params.groupId
    const body = await request.json()

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Validate input
    const { 
      name, 
      code, 
      curatorId 
    } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
    }

    // Use a transaction to ensure atomic updates
    const updatedGroup = await prisma.$transaction(async (tx) => {
      // First, find the existing group
      const existingGroup = await tx.group.findUnique({
        where: { id: groupId },
        include: { 
          curator: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      if (!existingGroup) {
        throw new Error('Группа не найдена')
      }

      // Prepare update data
      const groupUpdateData: any = {
        name,
        code
      }

      // Track if curator was changed
      let curatorChanged = false

      // If a new curator is provided, connect them
      if (curatorId) {
        // Verify curator exists
        const curatorExists = await tx.user.findUnique({
          where: { id: curatorId }
        })

        if (!curatorExists) {
          throw new Error('Указанный куратор не существует')
        }

        // Update the group with new curator
        groupUpdateData.curatorId = curatorId
        curatorChanged = true
      } else {
        groupUpdateData.curatorId = null
      }

      const updatedGroupResult = await tx.group.update({
        where: { id: groupId },
        data: groupUpdateData,
        include: {
          curator: true
        }
      })

      return {
        ...updatedGroupResult,
        curatorChanged
      }
    })

    return NextResponse.json({
      id: updatedGroup.id,
      code: updatedGroup.code,
      name: updatedGroup.name,
      curator: updatedGroup.curator ? {
        id: updatedGroup.curator.id,
        name: updatedGroup.curator.name
      } : null,
      curatorChanged: updatedGroup.curatorChanged
    })
  } catch (error) {
    console.error('Group update error:', error)
    return NextResponse.json({ 
      error: 'Не удалось обновить группу', 
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest, 
  context: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const groupId = context.params.groupId

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Use a transaction to ensure atomic deletion
    await prisma.$transaction(async (tx) => {
      // Remove test assignments for this group
      await tx.testAssignment.deleteMany({
        where: { groupId: groupId }
      })

      // Remove students in this group
      await tx.student.deleteMany({
        where: { groupId: groupId }
      })

      // Find users in this group
      const usersInGroup = await tx.user.findMany({
        where: { groups: { some: { id: groupId } } },
        select: { id: true }
      })

      // Disconnect users from the group
      for (const user of usersInGroup) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            groups: {
              disconnect: { id: groupId }
            }
          }
        })
      }

      // Delete the group
      await tx.group.delete({
        where: { id: groupId }
      })
    })
    
    return NextResponse.json({
      message: 'Группа успешно удалена'
    })
  } catch (error) {
    console.error('Group deletion error:', error)
    return NextResponse.json({ 
      error: 'Не удалось удалить группу', 
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 })
  }
}
