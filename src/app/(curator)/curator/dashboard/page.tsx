'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { toast } from 'sonner'
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Divider, 
  Select, 
  SelectItem 
} from "@nextui-org/react"
import { 
  FileText, 
  Users, 
  List,
  School,
  BookOpen,
  ClipboardList
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'
import { useTheme } from 'next-themes'

// Dynamically import charts to prevent SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

export default function CuratorDashboard() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login')
    }
  })

  const [tests, setTests] = useState([])
  const [groups, setGroups] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState('307ИС')

  const { theme } = useTheme()

  const getChartTheme = (baseOptions: ApexOptions): ApexOptions => ({
    ...baseOptions,
    chart: {
      ...baseOptions.chart,
      background: theme === 'dark' ? 'transparent' : 'transparent'
    },
    title: {
      ...baseOptions.title,
      style: {
        fontSize: '16px',
        color: theme === 'dark' ? '#ffffff' : '#333333'
      }
    },
    xaxis: {
      ...baseOptions.xaxis,
      labels: {
        style: {
          colors: theme === 'dark' ? '#ffffff' : '#333333'
        }
      }
    },
    yaxis: {
      ...baseOptions.yaxis,
      labels: {
        style: {
          colors: theme === 'dark' ? '#ffffff' : '#333333'
        }
      }
    },
    tooltip: {
      theme: theme === 'dark' ? 'dark' : 'light',
      style: {
        //@ts-ignore
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#333333'
      }
    },
    legend: {
      labels: {
        colors: theme === 'dark' ? '#ffffff' : '#333333'
      }
    }
  })

  const [stressLevelChartOptions, setStressLevelChartOptions] = useState<ApexOptions>({
    series: [
      {
        name: 'Уровень стресса',
        data: [
          { x: 'Низкий', y: 12 },
          { x: 'Средний', y: 18 },
          { x: 'Высокий', y: 5 }
        ]
      }
    ],
    chart: { 
      type: 'bar', 
      height: 350 
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
      }
    },
    colors: ['#3B82F6'],
    title: {
      text: 'Распределение уровня стресса',
      style: { 
        fontSize: '16px',
        color: '#333'
      }
    }
  })

  const [performanceChartOptions, setPerformanceChartOptions] = useState<ApexOptions>({
    series: [
      {
        name: 'Средний балл',
        data: [
          { x: 'Психология', y: 7.5 },
          { x: 'Стресс', y: 6.8 },
          { x: 'Адаптация', y: 8.2 }
        ]
      }
    ],
    chart: { 
      type: 'radar', 
      height: 350 
    },
    title: {
      text: 'Результаты тестирования',
      style: { 
        fontSize: '16px',
        color: '#333'
      }
    },
    xaxis: {
      categories: ['Психология', 'Стресс', 'Адаптация']
    },
    colors: ['#10B981']
  })

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'CURATOR') {
      toast.error('Unauthorized Access', {
        description: 'You do not have curator privileges'
      })
      redirect('/')
    }

    async function fetchDashboardData() {
      try {
        // Fetch tests
        const testsResponse = await fetch('/api/curator/tests')
        const testsData = await testsResponse.json()
        
        if (testsResponse.ok) {
          setTests(testsData)
        } else {
          toast.error('Error fetching tests', {
            description: testsData.error || 'Something went wrong'
          })
        }

        // Fetch groups
        const groupsResponse = await fetch('/api/curator/groups')
        const groupsData = await groupsResponse.json()
        
        if (groupsResponse.ok) {
          setGroups(groupsData)
        } else {
          toast.error('Error fetching groups', {
            description: groupsData.error || 'Something went wrong'
          })
        }
      } catch (error) {
        toast.error('Network Error', {
          description: 'Unable to fetch dashboard data'
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status, session])

  const handleCreateTest = () => {
    // Redirect to test creation page
    redirect('/curator/tests/create')
  }

  const handleCreateGroup = () => {
    // Redirect to group creation page
    redirect('/curator/groups/create')
  }

  const groupsList = [
    { key: '307ИС', label: 'Группа 307ИС' },
    { key: '308ИС', label: 'Группа 308ИС' },
    { key: '309ИС', label: 'Группа 309ИС' }
  ]

  const dashboardStats = [
    { 
      icon: <List />, 
      title: 'Активные тесты', 
      value: '3',
      color: 'primary'
    },
    { 
      icon: <Users />, 
      title: 'Студентов в группе', 
      value: '25',
      color: 'secondary'
    },
    { 
      icon: <FileText />, 
      title: 'Пройденных тестов', 
      value: '12',
      color: 'success'
    }
  ]

  useEffect(() => {
    setStressLevelChartOptions(prevOptions => 
      getChartTheme(prevOptions)
    )
    setPerformanceChartOptions(prevOptions => 
      getChartTheme(prevOptions)
    )
  }, [theme])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Панель куратора</h1>
        <Select
          label="Выберите группу"
          selectedKeys={[selectedGroup]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string
            setSelectedGroup(selected)
          }}
          className="max-w-xs"
          classNames={{
            trigger: "bg-white/70 dark:bg-gray-800/70 backdrop-blur-md",
            label: "text-gray-600 dark:text-gray-300",
            value: "text-gray-800 dark:text-white"
          }}
        >
          {groupsList.map((group) => (
            <SelectItem 
              key={group.key} 
              value={group.key}
              classNames={{
                base: "text-gray-800 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-700",
                selectedIcon: "text-blue-600 dark:text-blue-400"
              }}
            >
              {group.label}
            </SelectItem>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-6">
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
              className="hover:shadow-lg transition-all bg-white/70 dark:bg-gray-800/70 backdrop-blur-md"
              shadow="sm"
            >
              <CardHeader className="flex gap-3">
                <div className={`p-3 rounded-full bg-${stat.color}-50 text-${stat.color}-600`}>
                  {stat.icon}
                </div>
                <div className="flex flex-col">
                  <p className="text-md text-gray-800 dark:text-white">{stat.title}</p>
                </div>
              </CardHeader>
              <Divider/>
              <CardBody>
                <p className="text-3xl font-bold text-center text-gray-800 dark:text-white">{stat.value}</p>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 100 
          }}
        >
          <Card 
            className="h-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-md"
            shadow="sm"
          >
            <CardHeader className="text-gray-800 dark:text-white">Уровень стресса</CardHeader>
            <CardBody>
              <Chart 
                options={stressLevelChartOptions} 
                series={stressLevelChartOptions.series} 
                type="bar" 
                height={350} 
              />
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 100 
          }}
        >
          <Card 
            className="h-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-md"
            shadow="sm"
          >
            <CardHeader className="text-gray-800 dark:text-white">Результаты тестирования</CardHeader>
            <CardBody>
              <Chart 
                options={performanceChartOptions} 
                series={performanceChartOptions.series} 
                type="radar" 
                height={350} 
              />
            </CardBody>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tests Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-md rounded-lg p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">My Tests</h2>
            <button 
              onClick={handleCreateTest}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Create Test
            </button>
          </div>
          {isLoading ? (
            <div>Loading tests...</div>
          ) : tests.length === 0 ? (
            <p>No tests created yet</p>
          ) : (
            <ul className="space-y-2">
              {tests.map((test: any) => (
                <li 
                  key={test.id} 
                  className="border-b pb-2 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-medium">{test.title}</h3>
                    <p className="text-sm text-gray-500">
                      Difficulty: {test.difficulty}
                      {' | '}
                      Questions: {test._count?.questions || 0}
                      {' | '}
                      Assignments: {test._count?.assignments || 0}
                    </p>
                  </div>
                  <button className="text-blue-500 hover:underline">
                    View Details
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Groups Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-md rounded-lg p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">My Groups</h2>
            <button 
              onClick={handleCreateGroup}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Create Group
            </button>
          </div>
          {isLoading ? (
            <div>Loading groups...</div>
          ) : groups.length === 0 ? (
            <p>No groups created yet</p>
          ) : (
            <ul className="space-y-2">
              {groups.map((group: any) => (
                <li 
                  key={group.id} 
                  className="border-b pb-2 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-medium">{group.name}</h3>
                    <p className="text-sm text-gray-500">
                      Students: {group._count?.students || 0}
                      {' | '}
                      Tests: {group._count?.testAssignments || 0}
                    </p>
                  </div>
                  <button className="text-blue-500 hover:underline">
                    View Details
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  )
}
