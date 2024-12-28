import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Zod schema for student validation
const StudentSchema = z.object({
  firstName: z.string().min(1, { message: "Имя не может быть пустым" }),
  lastName: z.string().min(1, { message: "Фамилия не может быть пустой" }),
  middleName: z.string().optional().nullable(),
  id: z.string().optional()
})

export async function GET(
  request: NextRequest, 
  { params }: { params: { groupId: string } }
) {

  const idParams = await params

  try {
    const students = await prisma.student.findMany({
      where: { groupId: idParams.groupId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true
      }
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest, 
  { params }: { params: { groupId: string } }
) {
  console.log('POST Request Started')
  console.log('Full Request Headers:', Object.fromEntries(request.headers))
  console.log('Group ID:', params.groupId)

  try {
    // Ensure the request body is read correctly
    const contentType = request.headers.get('content-type')
    console.log('Content-Type:', contentType)

    let data;
    try {
      data = await request.json()
    } catch (parseError) {
      console.error('JSON Parsing Error:', parseError)
      return NextResponse.json(
        { 
          error: 'Некорректный формат данных', 
          details: String(parseError),
          parseErrorStack: parseError instanceof Error ? parseError.stack : 'No stack trace'
        }, 
        { status: 400 }
      )
    }

    console.log('Parsed Request Body:', JSON.stringify(data, null, 2))

    // Validate group ID
    if (!params.groupId) {
      console.error('Group ID is missing')
      return NextResponse.json(
        { error: 'Группа не указана' }, 
        { status: 400 }
      )
    }

    // Validate input using Zod
    try {
      // Support both single student and array of students
      const studentsData = Array.isArray(data) ? data : [data]
      
      console.log('Students to Create:', JSON.stringify(studentsData, null, 2))

      // Validate each student
      const validatedStudents = studentsData.map(student => 
        StudentSchema.parse({
          firstName: student.firstName,
          lastName: student.lastName,
          middleName: student.middleName || null
        })
      )

      console.log('Validated Students:', JSON.stringify(validatedStudents, null, 2))

      // Create students individually
      const createdStudents = await Promise.all(
        validatedStudents.map(async (student) => {
          console.log('Creating student:', JSON.stringify(student, null, 2))
          try {
            return await prisma.student.create({
              data: {
                firstName: student.firstName,
                lastName: student.lastName,
                middleName: student.middleName || null,
                groupId: params.groupId
              }
            })
          } catch (createError) {
            console.error('Error creating individual student:', createError)
            throw createError
          }
        })
      )

      console.log('Created Students:', JSON.stringify(createdStudents, null, 2))

      return NextResponse.json(createdStudents)
    } catch (validationError) {
      console.error('Validation Error:', validationError)
      
      if (validationError instanceof z.ZodError) {
        console.error('Zod Validation Errors:', validationError.errors)
        return NextResponse.json(
          { 
            error: 'Ошибка валидации данных',
            details: validationError.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message
            }))
          }, 
          { status: 400 }
        )
      }
      throw validationError
    }
  } catch (error) {
    // Log the full error for debugging
    console.error('Полная ошибка создания студентов:', error)
    
    // More detailed error response
    return NextResponse.json(
      { 
        error: 'Не удалось создать студентов',
        details: error instanceof Error 
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            }
          : String(error)
      }, 
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: { groupId: string, studentId: string } }
) {
  try {
    console.log('PUT Request Method')
    console.log('Group ID:', params.groupId)

    // Read request body
    let data;
    try {
      data = await request.json()
    } catch (parseError) {
      console.error('JSON Parsing Error:', parseError)
      return NextResponse.json(
        { error: 'Некорректный формат данных', details: String(parseError) }, 
        { status: 400 }
      )
    }

    console.log('Parsed Request Body:', JSON.stringify(data, null, 2))

    // Validate student data
    const studentId = params.studentId
    if (!studentId) {
      return NextResponse.json(
        { error: 'Идентификатор студента не указан' }, 
        { status: 400 }
      )
    }

    // Validate input using Zod
    const validatedStudent = StudentSchema.parse({
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName || null,
      id: studentId
    })

    // Update student
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        firstName: validatedStudent.firstName,
        lastName: validatedStudent.lastName,
        middleName: validatedStudent.middleName
      }
    })

    console.log('Updated Student:', JSON.stringify(updatedStudent, null, 2))

    return NextResponse.json(updatedStudent)
  } catch (error) {
    console.error('Полная ошибка обновления студента:', error)
    
    // More detailed error response
    return NextResponse.json(
      { 
        error: 'Не удалось обновить студента',
        details: error instanceof Error 
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            }
          : String(error)
      }, 
      { status: 500 }
    )
  }
}
