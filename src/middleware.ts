import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const path = request.nextUrl.pathname


  // Публичные пути
  const publicPaths = ['/login', '/']

  // Проверка публичных путей
  if (publicPaths.includes(path)) {
    return NextResponse.next()
  }

  // Если нет токена - редирект на логин
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Защита admin-путей
  if (path.startsWith('/a/') || path.startsWith('/admin/')) {
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Защита curator-путей
  if (path.startsWith('/curator/')) {
    if (token.role !== 'CURATOR') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Защита student-путей
  if (path.startsWith('/students/')) {
    if (token.role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

// Конфигурация middleware
export const config = {
  matcher: [
    // Защищаем все пути кроме публичных
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ]
}
