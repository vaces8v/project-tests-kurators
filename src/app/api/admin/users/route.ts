import { NextResponse } from 'next/server'
import { PrismaClient, UserRole } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Схема валидации для создания пользователя
const UserSchema = z.object({
  name: z.string().min(2, 'Имя слишком короткое'),
  login: z.string().min(3, 'Логин должен быть не короче 3 символов'),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'CURATOR']),
  email: z.string().email().optional()
})

const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10)
}

const generateTemporaryPassword = () => {
  return Math.random().toString(36).slice(-8)
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const roleParam = searchParams.get('role')?.toUpperCase()
  
  // Validate role is a valid UserRole
  const role = Object.values(UserRole).includes(roleParam as UserRole) 
    ? roleParam as UserRole 
    : undefined

  try {
    const users = await prisma.user.findMany({
      where: role ? { role } : {},
      select: {
        id: true,
        name: true,
        login: true,
        role: true,
        email: true,
        groups: {
          select: {
            id: true,
            name: true,
            code: true
          }
         }
      }
    })
    
    console.log('Fetched users:', JSON.stringify(users, null, 2))
    return NextResponse.json(users)
  } catch (error) {
    console.error('User fetch error:', error)
    return NextResponse.json({ 
      error: 'Не удалось получить список пользователей',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    console.log('Full request details:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers),
    })

    const { name, login, role, email, password, groups } = await request.json()

    // Validate input
    if (!name || !login || !role) {
      return NextResponse.json({ error: 'Name, login, and role are required' }, { status: 400 })
    }

    // Проверка уникальности логина
    const existingUser = await prisma.user.findUnique({
      where: { login }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Пользователь с таким логином уже существует' }, { status: 400 })
    }

    // Generate a temporary password if not provided
    const hashedPassword = password 
      ? await hashPassword(password) 
      : await hashPassword(generateTemporaryPassword())

    const user = await prisma.user.create({
      data: {
        name,
        login,
        role: role as UserRole,
        email,
        password: hashedPassword,
        ...(groups ? { 
          groups: { 
            connect: groups.map((groupId: string) => ({ id: groupId })) 
          } 
        } : {})
      },
      select: {
        id: true,
        name: true,
        login: true,
        role: true,
        email: true
      }
    })

    return NextResponse.json({
      user, 
      temporaryPassword: password ? null : generateTemporaryPassword()
    }, { status: 201 })
  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, name, login, role, email, groupIds } = body

    console.log('Received user update request:', {
      id, 
      name, 
      login, 
      role, 
      email, 
      groupIds
    })

    // Validate input
    if (!id || !name || !login) {
      return NextResponse.json({ error: 'ID, name, and login are required' }, { status: 400 })
    }

    // Perform a transaction to ensure data consistency
    const updatedUser = await prisma.$transaction(async (prisma) => {
      // First, update the user's basic information
      const user = await prisma.user.update({
        where: { id },
        data: {
          name,
          login,
          role,
          ...(email ? { email } : {})
        }
      })

      // Verify and manage groups
      if (groupIds && groupIds.length > 0) {
        // Verify groups exist
        const existingGroups = await prisma.group.findMany({
          where: { 
            id: { in: groupIds } 
          },
          select: { id: true, code: true, name: true }
        })

        console.log('Existing groups:', existingGroups)
        console.log('Requested group IDs:', groupIds)

        // Check if all requested groups exist
        const existingGroupIds = existingGroups.map(group => group.id)
        const missingGroupIds = groupIds.filter((id: string) => !existingGroupIds.includes(id))

        if (missingGroupIds.length > 0) {
          console.error('Missing group IDs:', missingGroupIds)
          throw new Error(`Groups not found: ${missingGroupIds.join(', ')}`)
        }

        // Determine if the user is a curator
        if (role === 'CURATOR') {
          // First, remove the user from all previously curated groups
          await prisma.group.updateMany({
            where: { curatorId: id },
            data: { curatorId: null }
          })

          // Then, update the new groups with this curator
          await prisma.group.updateMany({
            where: { 
              id: { in: groupIds } 
            },
            data: { curatorId: id }
          })
        } else {
          // If not a curator, disconnect from all groups
          await prisma.user.update({
            where: { id },
            data: { 
              groups: { 
                set: [] 
              } 
            }
          })
        }
      } else {
        // If no groups are provided, remove from all groups
        await prisma.group.updateMany({
          where: { curatorId: id },
          data: { curatorId: null }
        })
      }

      // Fetch updated user with groups
      const updatedUserWithGroups = await prisma.user.findUnique({
        where: { id },
        include: {
          groups: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      })

      return updatedUserWithGroups
    })

    console.log('Final updated user:', updatedUser)

    // Return the updated user with groups
    return NextResponse.json({
      ...updatedUser,
      groups: updatedUser?.groups || []
    })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ 
      error: 'Не удалось обновить пользователя',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    console.log('Full request details:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers),
    })

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'ID пользователя не указан' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ message: 'Пользователь удален' })
  } catch (error) {
    console.error('User deletion error:', error)
    return NextResponse.json({ 
      error: 'Не удалось удалить пользователя',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 })
  }
}
