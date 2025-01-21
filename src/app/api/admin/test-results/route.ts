import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    // Extract query parameters for filtering
    const { searchParams } = new URL(request.url)
    const groupCode = searchParams.get('group') || undefined
    const testName = searchParams.get('test') || undefined
    const category = searchParams.get('category') || undefined

    // Prepare dynamic filtering conditions
    const whereCondition: any = {}
    if (groupCode) {
      whereCondition.student = {
        group: {
          code: groupCode
        }
      }
    }
    if (testName) {
      whereCondition.test = {
        title: testName
      }
    }
    if (category) {
      whereCondition.test = {
        ...whereCondition.test,
        categories: {
          some: {
            name: category
          }
        }
      }
    }

    // Fetch test results with related data and dynamic filtering
    const testResults = await prisma.testResult.findMany({
      where: whereCondition,
      include: {
        student: {
          include: {
            group: {
              include: {
                curator: true // Include the curator information
              }
            }
          }
        },
        test: {
          include: {
            categories: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    // Calculate group average stress score
    const groupTestAverageScores: { 
      [key: string]: { 
        [key: string]: { 
          totalScore: number, 
          count: number, 
          results: typeof testResults,
          curatorName?: string 
        } 
      } 
    } = {}

    testResults.forEach(result => {
      const groupCode = result.student.group.code
      const testName = result.test.title
      const curatorName = result.student.group.curator?.name // Get curator name

      // Initialize group and test if not exists
      if (!groupTestAverageScores[groupCode]) {
        groupTestAverageScores[groupCode] = {}
      }

      if (!groupTestAverageScores[groupCode][testName]) {
        groupTestAverageScores[groupCode][testName] = { 
          totalScore: 0, 
          count: 0, 
          results: [],
          curatorName: curatorName // Store curator name
        }
      }

      // Accumulate total score and count for each group and test
      groupTestAverageScores[groupCode][testName].totalScore += result.totalScore
      groupTestAverageScores[groupCode][testName].count++
      groupTestAverageScores[groupCode][testName].results.push(result)
    })

    // Transform data to match the frontend interface
    const transformedResults: any[] = []
    const processedResults = new Set()

    Object.entries(groupTestAverageScores).forEach(([groupCode, testResults]) => {
      Object.entries(testResults).forEach(([testName, { totalScore, count, results, curatorName }]) => {
        // Create a unique key to prevent duplicates
        const resultKey = `${groupCode}-${testName}`
        
        if (!processedResults.has(resultKey)) {
          // Find a representative result for this group and test
          const representativeResult = results.find((result) => 
            result.student.group.code === groupCode && 
            result.test.title === testName
          )

          if (representativeResult) {
            const averageScore = count > 0 ? totalScore / count : 0

            transformedResults.push({
              id: representativeResult.id,
              studentName: curatorName || 'Средний результат группы', // Use curator name if available
              group: groupCode,
              testName: testName,
              completedAt: representativeResult.completedAt.toLocaleDateString('ru-RU'),
              averageStressScore: averageScore,
              categories: representativeResult.test.categories.map((category: { name: string }) => category.name),
              maxScore: representativeResult.test.maxScore || 0
            })

            processedResults.add(resultKey)
          }
        }
      })
    })

    // Prepare additional metadata for filtering
    const metadata = {
      groups: [...new Set(transformedResults.map(r => r.group))],
      testNames: [...new Set(transformedResults.map(r => r.testName))],
      categories: [...new Set(transformedResults.flatMap(r => r.categories))]
    }

    return NextResponse.json({
      results: transformedResults,
      metadata
    })
  } catch (error) {
    console.error('Error fetching test results:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch test results',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
