import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function requireAuth(
  handler: (req: Request) => Promise<NextResponse>, 
  allowedRoles?: string[]
) {
  return async (req: Request) => {
    const session = await getServerSession(authOptions)

    // Проверка авторизации
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверка ролей, если указаны
    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Выполнение основного обработчика
    return handler(req)
  }
}

// Хелперы для быстрого использования
export const adminOnly = (handler: (req: Request) => Promise<NextResponse>) => 
  requireAuth(handler, ['ADMIN'])

export const curatorOnly = (handler: (req: Request) => Promise<NextResponse>) => 
  requireAuth(handler, ['CURATOR', 'ADMIN'])

export const studentOnly = (handler: (req: Request) => Promise<NextResponse>) => 
  requireAuth(handler, ['STUDENT'])
