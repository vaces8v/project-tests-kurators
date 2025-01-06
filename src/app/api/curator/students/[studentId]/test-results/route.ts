import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface FormattedTestResult {
  id: string;
  testName: string;
  score: number;
  maxScore: number;
  passedAt: string;
}

export async function GET(
  req: NextRequest, 
  { params }: { params: { studentId: string } }
) {
  try {
    const studentId = params.studentId

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    const testResults = await prisma.testResult.findMany({
      where: { 
        studentId 
      },
      include: {
        test: true
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    // Transform results to match the FormattedTestResult interface
    const formattedResults: FormattedTestResult[] = testResults.map(result => ({
      id: result.id,
      testName: result.test.title,
      score: result.totalScore,
      maxScore: result.test.maxScore || result.totalScore,
      passedAt: result.completedAt.toISOString()
    }))

    return NextResponse.json(formattedResults)
  } catch (error) {
    console.error('Error fetching student test results:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch test results',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
