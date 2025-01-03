import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupCodesParam = searchParams.get('groupCodes')

    if (!groupCodesParam) {
      return NextResponse.json([], { status: 200 })
    }

    const groupCodes = groupCodesParam.split(',')

    const students = await prisma.student.findMany({
      where: {
        group: {
          code: {
            in: groupCodes
          }
        }
      },
      include: {
        group: true
      },
      orderBy: {
        lastName: 'asc'
      }
    })

    return NextResponse.json(students, { status: 200 })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' }, 
      { status: 500 }
    )
  }
}
