import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(
  req: NextRequest, 
  { params }: { params: { resultId: string } }
) {
  try {
    const resultId = params.resultId

    if (!resultId) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 })
    }

    // First, check if the test result exists
    const existingResult = await prisma.testResult.findUnique({
      where: { id: resultId }
    })

    if (!existingResult) {
      return NextResponse.json({ error: 'Test result not found' }, { status: 404 })
    }

    // Delete related responses first
    await prisma.testResponse.deleteMany({
      where: { testResultId: resultId }
    })

    // Then delete the test result
    const deletedResult = await prisma.testResult.delete({
      where: { id: resultId }
    })

    return NextResponse.json(deletedResult, { status: 200 })
  } catch (error) {
    console.error('Deleting test result error:', error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }

    // Check if the error is due to record not found
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma Error Code:', error.code)
      console.error('Prisma Error Meta:', error.meta)

      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Test result not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ 
      error: 'Failed to delete test result', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
