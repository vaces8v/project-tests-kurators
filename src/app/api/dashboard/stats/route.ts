import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { subDays, format } from 'date-fns'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const today = new Date()
    const sevenDaysAgo = subDays(today, 7)

    // User counts by role
    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    })

    // Total users
    const totalUsers = userCounts.reduce((sum, role) => sum + role._count.id, 0)

    // Active tests
    const activeTests = await prisma.test.count({
      where: { status: 'ACTIVE' }
    })

    // Completed tests
    const completedTests = await prisma.test.count({
      where: { status: 'COMPLETED' }
    })

    // Groups count
    const groupsCount = await prisma.group.count()

    // User activity over 7 days
    const userActivity = await prisma.user.groupBy({
      by: ['role', 'createdAt'],
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Transform user activity for chart
    const userActivitySeries = {
      administrators: new Array(7).fill(0),
      curators: new Array(7).fill(0),
      students: new Array(7).fill(0)
    }

    const dateLabels = Array.from({ length: 7 }, (_, i) => 
      format(subDays(today, 6 - i), 'yyyy-MM-dd')
    )

    userActivity.forEach(activity => {
      const dayIndex = dateLabels.indexOf(format(activity.createdAt, 'yyyy-MM-dd'))
      if (dayIndex !== -1) {
        switch (activity.role) {
          case 'ADMIN':
            userActivitySeries.administrators[dayIndex] = activity._count.id
            break
          case 'CURATOR':
            userActivitySeries.curators[dayIndex] = activity._count.id
            break
          case 'STUDENT':
            userActivitySeries.students[dayIndex] = activity._count.id
            break
        }
      }
    })

    // System load data
    const systemLoadSeries = {
      tests: new Array(7).fill(0),
      results: new Array(7).fill(0),
      users: new Array(7).fill(0)
    }

    const testsCreated = await prisma.test.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const testResultsCreated = await prisma.testResult.groupBy({
      by: ['completedAt'],
      where: {
        completedAt: {
          gte: sevenDaysAgo
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        completedAt: 'asc'
      }
    })

    testsCreated.forEach(test => {
      const dayIndex = dateLabels.indexOf(format(test.createdAt, 'yyyy-MM-dd'))
      if (dayIndex !== -1) {
        systemLoadSeries.tests[dayIndex] = test._count.id
      }
    })

    testResultsCreated.forEach(result => {
      const dayIndex = dateLabels.indexOf(format(result.completedAt, 'yyyy-MM-dd'))
      if (dayIndex !== -1) {
        systemLoadSeries.results[dayIndex] = result._count.id
      }
    })

    systemLoadSeries.users = userActivitySeries.students.map(
      (students, i) => students + userActivitySeries.curators[i] + userActivitySeries.administrators[i]
    )

    return NextResponse.json({
      dashboardStats: {
        totalUsers,
        groupsCount,
        activeTests,
        completedTests
      },
      userActivitySeries: [
        { name: 'Администраторы', data: userActivitySeries.administrators },
        { name: 'Кураторы', data: userActivitySeries.curators },
        { name: 'Студенты', data: userActivitySeries.students }
      ],
      systemLoadSeries: [
        { name: 'Тесты', data: systemLoadSeries.tests },
        { name: 'Результаты', data: systemLoadSeries.results },
        { name: 'Пользователи', data: systemLoadSeries.users }
      ],
      dateLabels,
      userActivityChartOptions: {
        series: [
          { name: 'Администраторы', data: userActivitySeries.administrators },
          { name: 'Кураторы', data: userActivitySeries.curators },
          { name: 'Студенты', data: userActivitySeries.students }
        ],
        chart: { 
          type: 'area', 
          height: 350,
          stacked: true,
          background: 'transparent',
          toolbar: { show: false },
          animations: {
            enabled: true,
            speed: 1500,
            animateGradually: {
              enabled: true,
              delay: 300
            }
          }
        },
        colors: ['#3B82F6', '#10B981', '#F43F5E'],
        fill: {
          type: 'gradient',
          gradient: {
            type: 'vertical',
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.2
          }
        },
        stroke: {
          curve: 'smooth',
          width: 4
        },
        dataLabels: { enabled: false }
      },
      systemLoadChartOptions: {
        series: [
          { name: 'Тесты', data: systemLoadSeries.tests },
          { name: 'Результаты', data: systemLoadSeries.results },
          { name: 'Пользователи', data: systemLoadSeries.users }
        ],
        chart: { 
          type: 'line', 
          height: 350,
          toolbar: { show: false },
          animations: {
            enabled: true,
            speed: 1500,
            animateGradually: {
              enabled: true,
              delay: 300
            }
          }
        },
        colors: ['#3B82F6', '#10B981', '#F43F5E'],
        stroke: {
          curve: 'smooth',
          width: 4
        },
        dataLabels: { enabled: false }
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
