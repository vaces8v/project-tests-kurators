import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// Diagnostic function to log session details
async function logSessionDetails() {
  const session = await getServerSession(authOptions)
  console.log('Detailed Session Diagnostics:', {
    sessionExists: !!session,
    userId: session?.user?.id,
    role: session?.user?.role,
    login: session?.user?.login,
    email: session?.user?.email,
    name: session?.user?.name,
    // Add more details as needed
  })
  return session
}

export async function GET(
  request: Request, 
  { params }: { params: { groupId: string } }
) {
  try {
    // Log full request details
    console.log('Incoming Request Details:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      params: params
    })

    const session = await getServerSession(authOptions)
    
    // Comprehensive session validation
    if (!session) {
      console.error('No active session found')
      return NextResponse.json({ 
        error: 'Authentication Failed', 
        details: 'No active session. Please log in again.' 
      }, { status: 401 })
    }

    if (!session.user) {
      console.error('Session exists but user object is missing')
      return NextResponse.json({ 
        error: 'Authentication Incomplete', 
        details: 'User details are missing from the session.' 
      }, { status: 403 })
    }

    if (session.user.role !== 'CURATOR') {
      console.error(`Unauthorized role attempt: ${session.user.role}`)
      return NextResponse.json({ 
        error: 'Unauthorized Access', 
        details: `Role ${session.user.role} is not permitted to access this resource` 
      }, { status: 403 })
    }

    // Safely extract groupId
    const groupId = params.groupId

    // Verify group ownership
    const group = await prisma.group.findUnique({
      where: { 
        id: groupId,
        // Allow access to groups with no curator or assigned to this curator
        OR: [
          { curatorId: session.user.id },
          { curatorId: null }
        ]
      },
      select: {
        id: true,
        name: true,
        code: true,
        curatorId: true
      }
    })

    if (!group) {
      console.error('Group not found or not authorized', {
        requestedGroupId: groupId,
        currentCuratorId: session.user.id,
        existingGroups: await prisma.group.findMany({
          where: { curatorId: session.user.id },
          select: { id: true, name: true }
        })
      })
      
      return NextResponse.json({ 
        error: 'Group Access Denied', 
        details: `Group ${groupId} not found or does not belong to current curator` 
      }, { status: 404 })
    }

    // Fetch students for the specific group
    const students = await prisma.student.findMany({
      where: { 
        groupId: groupId 
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        group: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        testAssignments: {
          select: {
            status: true
          },
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    console.log(`Student Fetch Results:`, {
      groupId,
      studentCount: students.length,
      studentIds: students.map(s => s.id)
    })

    // Transform students to match the expected interface
    const transformedStudents = students.map(student => ({
      id: student.id,
      name: `${student.lastName} ${student.firstName}${student.middleName ? ` ${student.middleName}` : ''}`.trim(),
      group: student.group.id,
      testStatus: student.testAssignments.length > 0 
        ? student.testAssignments[0].status 
        : 'not_started'
    }))

    return NextResponse.json(transformedStudents)
  } catch (error) {
    console.error('Comprehensive Error in Students Route:', {
      errorName: error instanceof Error ? error.name : 'Unknown Error',
      errorMessage: error instanceof Error ? error.message : 'No error message',
      errorStack: error instanceof Error ? error.stack : 'No stack trace'
    })

    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error 
        ? `${error.name}: ${error.message}` 
        : 'An unexpected error occurred',
      trace: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
