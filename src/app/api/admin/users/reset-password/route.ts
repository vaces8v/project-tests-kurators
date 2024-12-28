import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const prisma = new PrismaClient()

const ResetPasswordSchema = z.object({
  id: z.string(),
  password: z.string().min(6, 'Пароль должен быть не короче 6 символов')
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, password } = ResetPasswordSchema.parse(body)

    // Обновление пароля пользователя
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        password 
      },
      select: {
        id: true,
        name: true,
        login: true
      }
    })

    return NextResponse.json({ 
      message: 'Пароль успешно обновлен',
      user: updatedUser 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Ошибка валидации',
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Не удалось сбросить пароль',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 })
  }
}
