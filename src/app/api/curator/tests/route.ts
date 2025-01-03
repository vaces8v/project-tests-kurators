import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  // Ensure only curators can create tests
  if (!session || session.user.role !== 'CURATOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { title, description, difficulty, questions, groupIds } = await request.json()

    const test = await prisma.test.create({
      data: {
        title,
        description,
        author: { connect: { id: session.user.id } },
        questions: {
          create: questions.map((q: any) => ({
            text: q.text,
            type: q.type,
            options: q.options || [],
            order: q.order || 1
          }))
        },
        testAssignments: {
          create: groupIds.map((groupId: string) => ({
            group: { connect: { id: groupId } },
            uniqueLink: `/test/${randomBytes(16).toString('hex')}`
          }))
        }
      },
      include: {
        questions: true,
        testAssignments: true
      }
    })

    return NextResponse.json(test, { status: 201 })
  } catch (error) {
    console.error('Test creation error:', error)
    return NextResponse.json({ error: 'Test creation failed', details: error }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  // Ensure only curators can list their tests
  if (!session || session.user.role !== 'CURATOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    // Find groups managed by this curator
    const groups = await prisma.group.findMany({
      where: { curatorId: session.user.id },
      select: { id: true }
    })

    const tests = await prisma.test.findMany({
      where: {
        OR: [
          { authorId: session.user.id },
          { testAssignments: { some: { groupId: { in: groups.map(g => g.id) } } } }
        ]
      },
      include: {
        testAssignments: {
          select: {
            group: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: { 
            testAssignments: true, 
            questions: true,
            testResults: true
          }
        }
      }
    })

    return NextResponse.json(tests)
  } catch (error) {
    console.error('Tests fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch tests', details: error }, { status: 500 })
  }
}
