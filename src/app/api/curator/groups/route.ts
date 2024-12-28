import { NextResponse } from 'next/server'
import { Prisma, PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hashPassword, generateRandomPassword } from '@/lib/utils'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('Session:', session) // Debug logging
    
    // Ensure only curators can access their groups
    if (!session) {
      console.error('No session found')
      return NextResponse.json({ error: 'No active session' }, { status: 401 })
    }

    if (session.user.role !== 'CURATOR') {
      console.error('User is not a curator', session.user.role)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    try {
      const groups = await prisma.group.findMany({
        where: { 
          // Include groups with no curator OR groups assigned to this curator
          OR: [
            { curatorId: session.user.id },
            { curatorId: null }
          ]
        },
        include: {
          _count: {
            select: { 
              groupStudentModels: true
            }
          }
        }
      })

      return NextResponse.json(groups)
    } catch (error) {
      console.error('Groups fetch error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch groups', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('GET request error:', error)
    return NextResponse.json({ 
      error: 'Failed to process GET request', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('Session:', session) // Debug logging
    
    // Ensure only curators can create groups
    if (!session) {
      console.error('No session found')
      return NextResponse.json({ error: 'No active session' }, { status: 401 })
    }

    if (session.user.role !== 'CURATOR') {
      console.error('User is not a curator', session.user.role)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    try {
      const { name, students } = await request.json()

      // Validate input
      if (!name || name.trim() === '') {
        console.error('Group name is required')
        return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
      }

      // Check if a group with this name already exists for this curator
      try {
        const existingGroup = await prisma.group.findFirst({
          where: {
            name: name.trim(),
            curatorId: session.user.id
          }
        })

        if (existingGroup) {
          console.error('A group with this name already exists')
          return NextResponse.json({ error: 'A group with this name already exists' }, { status: 409 })
        }
      } catch (error) {
        console.error('Error checking for existing group:', error)
        return NextResponse.json({ 
          error: 'Failed to check for existing group', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 })
      }

      // Validate students input
      try {
        const validatedStudents = students ? await Promise.all(students.map(async (student: any) => {
          // Validate student email
          if (!student.email || !/\S+@\S+\.\S+/.test(student.email)) {
            throw new Error(`Invalid email for student: ${student.name || 'Unknown'}`)
          }

          // Check if student with this email already exists
          try {
            const existingStudent = await prisma.user.findUnique({
              where: { 
                email: student.email,
                login: student.email.split('@')[0]
              }
            })

            if (existingStudent) {
              // If student exists, return the existing student
              return existingStudent
            }

            // Create new student if not exists
            return await prisma.user.create({
              data: {
                email: student.email,
                login: student.email.split('@')[0],
                name: student.name || student.email.split('@')[0],
                password: await hashPassword(student.password || generateRandomPassword()),
                role: 'STUDENT'
              }
            })
          } catch (error) {
            console.error('Error validating student:', error)
            throw error
          }
        })) : []

        // Create the group
        try {
          const group = await prisma.group.create({
            data: {
              name: name.trim(),
              code: `GROUP-${Date.now()}`, // Generate a unique code
              curator: { connect: { id: session.user.id } },
              ...(validatedStudents.length > 0 ? { 
                students: { 
                  connect: validatedStudents.map(student => ({ id: student.id })) 
                } 
              } : {})
            },
            include: {
              students: true,
              curator: true
            } as Prisma.GroupInclude
          });

          return NextResponse.json(group, { status: 201 })
        } catch (error) {
          console.error('Error creating group:', error)
          return NextResponse.json({ 
            error: 'Failed to create group', 
            details: error instanceof Error ? error.message : 'Unknown error' 
          }, { status: 500 })
        }
      } catch (error) {
        console.error('Error validating students:', error)
        return NextResponse.json({ 
          error: 'Failed to validate students', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 })
      }
    } catch (error) {
      console.error('Error parsing request body:', error)
      return NextResponse.json({ 
        error: 'Failed to parse request body', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('POST request error:', error)
    return NextResponse.json({ 
      error: 'Failed to process POST request', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
