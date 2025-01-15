'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Divider, 
  Select, 
  SelectItem,
  Spinner 
} from "@nextui-org/react"
import { 
  Users, 
  List,
  School,
  BookOpen,
  ClipboardList
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'
import { useTheme } from 'next-themes'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

export default function AdminDashboard() {
  const { theme } = useTheme()
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [dashboardData, setDashboardData] = useState<{
    dashboardStats: {
      totalUsers: number
      groupsCount: number
      activeTests: number
      completedTests: number
    }
    userActivitySeries: { name: string, data: number[] }[]
    systemLoadSeries: { name: string, data: number[] }[]
    dateLabels: string[]
    userActivityChartOptions: ApexOptions
    systemLoadChartOptions: ApexOptions
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats')
        }
        const data = await response.json()
        setDashboardData(data)
        setIsLoading(false)
      } catch (error) {
        console.error('Dashboard data fetch error:', error)
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getChartTheme = (baseOptions: ApexOptions): ApexOptions => ({
    ...baseOptions,
    chart: {
      ...baseOptions.chart,
      background: 'transparent',
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      offsetX: 0,
      offsetY: 0,
      sparkline: {
        enabled: false
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      lineCap: 'round'
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: theme === 'dark' ? 'dark' : 'light',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: theme === 'dark' 
          ? ['rgba(59, 130, 246, 0.3)', 'rgba(147, 51, 234, 0.3)']
          : ['rgba(59, 130, 246, 0.5)', 'rgba(147, 51, 234, 0.5)'],
        stops: [0, 90, 100]
      }
    },
    title: {
      ...baseOptions.title,
      style: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: theme === 'dark' ? '#e5e7eb' : '#1f2937'
      }
    },
    grid: {
      show: true,
      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      strokeDashArray: 3,
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    xaxis: {
      ...baseOptions.xaxis,
      categories: dashboardData?.dateLabels || [],
      labels: {
        style: {
          colors: theme === 'dark' ? '#9ca3af' : '#4b5563',
          fontSize: '10px'
        },
        rotate: 0,
        rotateAlways: false,
        trim: true,
      },
      tickAmount: dashboardData?.dateLabels?.length || 7,
      axisTicks: {
        show: false
      },
      tooltip: {
        enabled: false
      }
    },
    yaxis: {
      ...baseOptions.yaxis,
      labels: {
        style: {
          colors: theme === 'dark' ? '#9ca3af' : '#4b5563',
          fontSize: '10px'
        },
        formatter: (value: number, opts?: any) => value.toFixed(0)
      },
      axisBorder: {
        show: false
      },
      crosshairs: {
        show: false
      }
    },
    tooltip: {
      theme: theme === 'dark' ? 'dark' : 'light',
      style: {
        //@ts-ignore
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#333333',
        fontSize: '12px'
      }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      floating: true,
      labels: {
        colors: theme === 'dark' ? '#e5e7eb' : '#1f2937',
        useSeriesColors: false
      },
      markers: {
        width: 12,
        height: 12,
        radius: 12
      } as ApexOptions['legend']
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    ]
  })

  useEffect(() => {
    if (dashboardData) {
      const userActivityChartOptions = getChartTheme(dashboardData.userActivityChartOptions)
      const systemLoadChartOptions = getChartTheme(dashboardData.systemLoadChartOptions)
      setUserActivityChartOptions(userActivityChartOptions)
      setSystemLoadChartOptions(systemLoadChartOptions)
    }
  }, [theme, dashboardData])

  const [userActivityChartOptions, setUserActivityChartOptions] = useState<ApexOptions>({})
  const [systemLoadChartOptions, setSystemLoadChartOptions] = useState<ApexOptions>({})

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  const dashboardStats = [
    { 
      icon: <Users />, 
      title: 'Всего пользователей', 
      value: dashboardData?.dashboardStats.totalUsers.toString() || '0',
      color: 'primary'
    },
    { 
      icon: <School />, 
      title: 'Количество групп', 
      value: dashboardData?.dashboardStats.groupsCount.toString() || '0',
      color: 'secondary'
    },
    { 
      icon: <BookOpen />, 
      title: 'Активных тестов', 
      value: dashboardData?.dashboardStats.activeTests.toString() || '0',
      color: 'success'
    },
    { 
      icon: <ClipboardList />, 
      title: 'Пройденных тестов', 
      value: dashboardData?.dashboardStats.completedTests.toString() || '0',
      color: 'warning'
    }
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white w-full text-center sm:text-left">Панель администратора</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {dashboardStats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.2,
              type: "spring",
              stiffness: 100 
            }}
          >
            <Card 
              className={`
                relative overflow-hidden 
                bg-gradient-to-br 
                from-${stat.color}-50/50 to-${stat.color}-100/50 
                dark:from-${stat.color}-900/30 dark:to-${stat.color}-900/50 
                border border-${stat.color}-100 dark:border-${stat.color}-800
                hover:shadow-md transition-all
                h-full
              `}
            >
              <div className="absolute top-0 right-0 opacity-10">
                {React.cloneElement(stat.icon, { 
                  size: 80, 
                  className: `text-${stat.color}-600 dark:text-${stat.color}-400`
                })}
              </div>
              <CardHeader className="pb-0 pt-4 px-4 flex items-center justify-between">
                <div className={`
                  p-2 rounded-full 
                  bg-${stat.color}-100 
                  text-${stat.color}-600 
                  dark:bg-${stat.color}-900/50 
                  dark:text-${stat.color}-400
                `}>
                  {React.cloneElement(stat.icon, { size: 16 })}
                </div>
              </CardHeader>
              <CardBody className="pt-2 pb-4 px-4 space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  {stat.title}
                </p>
                <p className="text-lg font-bold text-gray-800 dark:text-white">
                  {stat.value}
                </p>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 overflow-hidden">
        <motion.div
          className='overflow-hidden'
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 100 
          }}
        >
          <Card className="h-full overflow-hidden dark:bg-gray-800/70 bg-white/70 backdrop-blur-md">
            <CardHeader className="text-md sm:text-lg font-semibold text-gray-700 dark:text-white">Активность пользователей</CardHeader>
            <CardBody>
              {dashboardData ? (
                <Chart 
                  options={userActivityChartOptions} 
                  series={dashboardData.userActivitySeries} 
                  type="area" 
                  height={250} 
                />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <Spinner size="lg" />
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          className='overflow-hidden'
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 100 
          }}
        >
          <Card className="h-full overflow-hidden dark:bg-gray-800/70 bg-white/70 backdrop-blur-md">
            <CardHeader className="text-md sm:text-lg font-semibold text-gray-700 dark:text-white">Нагрузка системы</CardHeader>
            <CardBody>
              {dashboardData ? (
                <Chart 
                  options={systemLoadChartOptions} 
                  series={dashboardData.systemLoadSeries} 
                  type="line" 
                  height={250} 
                />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <Spinner size="lg" />
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
