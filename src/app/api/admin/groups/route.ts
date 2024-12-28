import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

function generateGroupCode() {
  // Simple implementation, you may want to use a more robust method
  return Math.random().toString(36).substr(2, 9).toUpperCase()
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const groups = await prisma.group.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        curator: {
          select: {
            id: true,
            name: true
          }
        },
        groupStudentModels: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })
    
    console.log('Groups fetched:', JSON.stringify(groups, null, 2))
    return NextResponse.json(groups)
  } catch (error) {
    return NextResponse.json({ 
      error: 'Не удалось получить список групп',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Log the entire request for debugging
    const requestBody = await request.text()
    console.log('Raw request body:', requestBody)

    // Parse the JSON manually
    let body;
    try {
      body = JSON.parse(requestBody)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return new NextResponse(JSON.stringify({ 
        error: 'Некорректный формат JSON',
        details: parseError instanceof Error ? parseError.message : 'Неизвестная ошибка парсинга'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate input
    const { 
      name, 
      code, 
      curatorId,  
      studentIds = [] 
    } = body

    console.log('Parsed group data:', { 
      name, 
      code, 
      curatorId, 
      studentIds,
      body: JSON.stringify(body, null, 2)
    })

    // Validate input
    if (!code || !name) {
      return new NextResponse(JSON.stringify({ 
        error: 'Code and name are required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verify curator exists if provided
    let curatorExists = null
    if (curatorId) {
      curatorExists = await prisma.user.findUnique({
        where: { id: curatorId }
      })

      if (!curatorExists) {
        return new NextResponse(JSON.stringify({ 
          error: 'Указанный куратор не существует',
          details: `Curator ID: ${curatorId}`
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    const newGroup = await prisma.$transaction(async (prisma) => {
      // Create the group
      const group = await prisma.group.create({
        data: {
          code: code, 
          name: name,
          // Explicitly connect curator if exists
          ...(curatorId ? { 
            curator: { 
              connect: { id: curatorId } 
            } 
          } : {})
        },
        include: {
          curator: true
        }
      })

      // If curator exists, update their groups
      if (curatorId) {
        await prisma.user.update({
          where: { id: curatorId },
          data: {
            groups: {
              connect: { id: group.id }
            }
          }
        })
      }

      return group
    })
    
    console.log('Created group:', JSON.stringify(newGroup, null, 2))
    
    return new NextResponse(JSON.stringify(newGroup), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Unhandled group creation error:', error)
    
    // Attempt to get more detailed error information
    const errorResponse = {
      error: 'Не удалось создать группу',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    }

    console.error('Detailed error response:', JSON.stringify(errorResponse, null, 2))

    return new NextResponse(JSON.stringify(errorResponse), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const id = params.id

    // Validate input
    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    await prisma.group.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Группа успешно удалена' })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Не удалось удалить группу',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 })
  }
}
