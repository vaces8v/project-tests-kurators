import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest, 
  { params }: { params: { groupId: string } }
) {
  try {
    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
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
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const groupId = params.groupId

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Parse the request body
    const body = await request.json()
    
    console.log('Group update request:', { 
      groupId,
      body: JSON.stringify(body, null, 2)
    })

    // Validate input
    const { 
      name, 
      code, 
      curatorId,  
      curator
    } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
    }

    // Use a transaction to ensure atomic updates
    const updatedGroup = await prisma.$transaction(async (prisma) => {
      // First, find the existing group and its current curator
      const existingGroup = await prisma.group.findUnique({
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
        const curatorExists = await prisma.user.findUnique({
          where: { id: curatorId }
        })

        if (!curatorExists) {
          throw new Error('Указанный куратор не существует')
        }

        // Disconnect the curator from any previous groups
        await prisma.group.updateMany({
          where: { curatorId: curatorId },
          data: { curatorId: null }
        })

        // Update the group with new curator
        groupUpdateData.curatorId = curatorId
        curatorChanged = true

        // Update the curator's groups
        await prisma.user.update({
          where: { id: curatorId },
          data: {
            groups: {
              connect: { id: groupId }
            }
          }
        })

        console.log('Connected new curator:', {
          curatorId,
          groupId
        })
      } else {
        groupUpdateData.curatorId = null
      }
      const updatedGroupResult = await prisma.group.update({
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

    console.log('Updated group:', JSON.stringify(updatedGroup, null, 2))
    
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
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const groupId = params.groupId

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Use a transaction to ensure atomic deletion
    const deletionResult = await prisma.$transaction(async (prisma) => {
      // First, find the group to get its curator
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: { 
          curator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          groupStudentModels: true 
        }
      })

      if (!group) {
        throw new Error('Группа не найдена')
      }

      // Log group and curator details before deletion
      console.log('Group deletion details:', {
        groupId: group.id,
        groupName: group.name,
        curatorId: group.curator?.id,
        curatorName: group.curator?.name
      })

      // If the group has a curator, disconnect the group from the curator
      if (group.curator) {
        const curatorUpdateResult = await prisma.user.update({
          where: { id: group.curator.id },
          data: {
            groups: {
              disconnect: { id: groupId }
            }
          }
        })

        console.log('Curator update result:', {
          curatorId: curatorUpdateResult.id,
          curatorName: curatorUpdateResult.name
        })
      }

      // Delete all student models associated with the group
      const studentDeletionResult = await prisma.student.deleteMany({
        where: { groupId: groupId }
      })

      console.log('Student deletion result:', {
        deletedStudentsCount: studentDeletionResult.count
      })

      // Finally, delete the group
      const deletedGroup = await prisma.group.delete({
        where: { id: groupId }
      })

      return {
        deletedGroup,
        curatorDisconnected: !!group.curator
      }
    })

    return NextResponse.json({
      message: 'Группа успешно удалена',
      deletedGroupId: deletionResult.deletedGroup.id,
      curatorDisconnected: deletionResult.curatorDisconnected
    })
  } catch (error) {
    console.error('Group deletion error:', error)
    return NextResponse.json({ 
      error: 'Не удалось удалить группу',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 })
  }
}
