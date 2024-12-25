'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

export default function AdminDashboard() {
  const { theme } = useTheme()
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  const periods = [
    { key: 'month', label: 'За месяц' },
    { key: 'quarter', label: 'За квартал' },
    { key: 'year', label: 'За год' }
  ]

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

  const [userActivityChartOptions, setUserActivityChartOptions] = useState<ApexOptions>({
    series: [
      {
        name: 'Активность пользователей',
        data: [
          { x: 'Администраторы', y: 12 },
          { x: 'Кураторы', y: 45 },
          { x: 'Студенты', y: 78 }
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
      text: 'Активность пользователей',
      style: { 
        fontSize: '16px',
        color: '#333'
      }
    }
  })

  const [systemLoadChartOptions, setSystemLoadChartOptions] = useState<ApexOptions>({
    series: [
      {
        name: 'Нагрузка системы',
        data: [
          { x: 'Тесты', y: 65 },
          { x: 'Результаты', y: 45 },
          { x: 'Пользователи', y: 30 }
        ]
      }
    ],
    chart: { 
      type: 'radar', 
      height: 350 
    },
    title: {
      text: 'Нагрузка системы',
      style: { 
        fontSize: '16px',
        color: '#333'
      }
    },
    xaxis: {
      categories: ['Тесты', 'Результаты', 'Пользователи']
    },
    colors: ['#10B981']
  })

  useEffect(() => {
    setUserActivityChartOptions(prevOptions => 
      getChartTheme(prevOptions)
    )
    setSystemLoadChartOptions(prevOptions => 
      getChartTheme(prevOptions)
    )
  }, [theme])

  const dashboardStats = [
    { 
      icon: <Users />, 
      title: 'Всего пользователей', 
      value: '250',
      color: 'primary'
    },
    { 
      icon: <School />, 
      title: 'Количество групп', 
      value: '15',
      color: 'secondary'
    },
    { 
      icon: <BookOpen />, 
      title: 'Активных тестов', 
      value: '22',
      color: 'success'
    },
    { 
      icon: <ClipboardList />, 
      title: 'Пройденных тестов', 
      value: '345',
      color: 'warning'
    }
  ]

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Панель администратора</h1>
        <Select
          label="Период"
          selectedKeys={[selectedPeriod]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string
            setSelectedPeriod(selected)
          }}
          className="max-w-xs"
          classNames={{
            trigger: "bg-white/70 dark:bg-gray-800/70 backdrop-blur-md",
            label: "text-gray-600 dark:text-gray-300",
            value: "text-gray-800 dark:text-white"
          }}
        >
          {periods.map((period) => (
            <SelectItem 
              key={period.key} 
              value={period.key}
              classNames={{
                base: "text-gray-800 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-700",
                selectedIcon: "text-blue-600 dark:text-blue-400"
              }}
            >
              {period.label}
            </SelectItem>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-4 gap-6">
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
            <Card className="hover:shadow-lg transition-all dark:bg-gray-800/70 bg-white/70 backdrop-blur-md">
              <CardHeader className="flex gap-3">
                <div className={`p-3 rounded-full bg-${stat.color}-50 text-${stat.color}-600 dark:bg-${stat.color}-900/50 dark:text-${stat.color}-400`}>
                  {stat.icon}
                </div>
                <div className="flex flex-col">
                  <p className="text-md text-gray-600 dark:text-white">{stat.title}</p>
                </div>
              </CardHeader>
              <Divider className="dark:bg-gray-700"/>
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
          <Card className="h-full dark:bg-gray-800/70 bg-white/70 backdrop-blur-md">
            <CardHeader className="text-lg font-semibold text-gray-700 dark:text-white">Активность пользователей</CardHeader>
            <CardBody>
              <Chart 
                options={userActivityChartOptions} 
                series={userActivityChartOptions.series} 
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
          <Card className="h-full dark:bg-gray-800/70 bg-white/70 backdrop-blur-md">
            <CardHeader className="text-lg font-semibold text-gray-700 dark:text-white">Нагрузка системы</CardHeader>
            <CardBody>
              <Chart 
                options={systemLoadChartOptions} 
                series={systemLoadChartOptions.series} 
                type="radar" 
                height={350} 
              />
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
