import { NextResponse } from 'next/server'
import { PrismaClient, LearningStyle } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { 
      testId, 
      groupId, 
      studentName, 
      answers, 
      totalScore, 
      maxScore,
      learningStyle,
      learningStyleRecommendation 
    } = await request.json()

    // Verify test assignment exists
    const testAssignment = await prisma.testAssignment.findFirst({
      where: { 
        testId, 
        groupId 
      }
    })

    if (!testAssignment) {
      return NextResponse.json({ error: 'Invalid test assignment' }, { status: 400 })
    }

    // Create test result
    const testResult = await prisma.testResult.create({
      data: {
        test: { connect: { id: testId } },
        group: { connect: { id: groupId } },
        studentName,
        answers,
        totalScore,
        maxScore,
        learningStyle: learningStyle as LearningStyle,
        learningStyleRecommendation
      }
    })

    return NextResponse.json(testResult, { status: 201 })
  } catch (error) {
    console.error('Test result submission error:', error)
    return NextResponse.json({ error: 'Test result submission failed' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('groupId')
  const testId = searchParams.get('testId')

  try {
    const results = await prisma.testResult.findMany({
      where: {
        groupId: groupId || undefined,
        testId: testId || undefined
      },
      orderBy: {
        totalScore: 'desc'
      }
    })

    // Calculate group statistics
    const stats = {
      totalStudents: results.length,
      averageScore: results.length 
        ? results.reduce((sum, r) => sum + r.totalScore, 0) / results.length 
        : 0,
      highestScore: results.length 
        ? Math.max(...results.map(r => r.totalScore)) 
        : 0,
      lowestScore: results.length 
        ? Math.min(...results.map(r => r.totalScore)) 
        : 0
    }

    return NextResponse.json({ results, stats })
  } catch (error) {
    console.error('Test results fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch test results' }, { status: 500 })
  }
}
