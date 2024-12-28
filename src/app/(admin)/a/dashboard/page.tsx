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
      //@ts-ignore
      style: {
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#333333',
        fontSize: '12px',
        padding: '8px',
        maxWidth: '200px'
      } as React.CSSProperties
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
        name: 'Администраторы',
        data: [12, 15, 11, 14, 16, 13, 12]
      },
      {
        name: 'Кураторы',
        data: [45, 50, 42, 48, 52, 46, 45]
      },
      {
        name: 'Студенты',
        data: [78, 85, 72, 80, 88, 76, 79]
      }
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
      },
      dropShadow: {
        enabled: true,
        top: 0,
        left: 0,
        blur: 10,
        opacity: 0.1
      }
    },
    colors: ['#3B82F6', '#10B981', '#F43F5E'],
    fill: {
      type: 'gradient',
      gradient: {
        type: 'vertical',
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 100],
        colorStops: [
          {
            offset: 0,
            color: '#3B82F6',
            opacity: 0.9
          },
          {
            offset: 50,
            color: '#3B82F6',
            opacity: 0.5
          },
          {
            offset: 100,
            color: '#3B82F6',
            opacity: 0.1
          }
        ]
      }
    },
    stroke: {
      curve: 'smooth',
      width: 4,
      lineCap: 'round'
    },
    grid: {
      show: true,
      borderColor: 'rgba(0,0,0,0.05)',
      strokeDashArray: 4,
      padding: {
        left: 20,
        right: 20
      },
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    xaxis: {
      type: 'datetime',
      categories: [
        '2024-01-01', 
        '2024-01-02', 
        '2024-01-03', 
        '2024-01-04', 
        '2024-01-05', 
        '2024-01-06', 
        '2024-01-07'
      ],
      labels: {
        format: 'dd MMM',
        style: {
          colors: '#888',
          fontSize: '10px'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        formatter: function(val) {
          return val.toFixed(0)
        },
        style: {
          colors: '#888',
          fontSize: '10px'
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      theme: 'dark',
      x: {
        format: 'dd MMM yyyy'
      },
      y: {
        formatter: function(val, { series, seriesIndex, dataPointIndex }) {
          return `${series[seriesIndex][dataPointIndex]}`
        },
        title: {
          formatter: (seriesName) => seriesName
        }
      },
      marker: {
        show: true
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      offsetX: 40,
      labels: {
        colors: '#888'
      }
    }
  })

  const [systemLoadChartOptions, setSystemLoadChartOptions] = useState<ApexOptions>({
    series: [
      {
        name: 'Тесты',
        data: [65, 70, 62, 68, 72, 60, 66]
      },
      {
        name: 'Результаты',
        data: [45, 50, 42, 48, 52, 40, 46]
      },
      {
        name: 'Пользователи',
        data: [30, 35, 28, 32, 38, 26, 32]
      }
    ],
    chart: { 
      type: 'line', 
      height: 350,
      toolbar: { show: false },
      zoom: {
        enabled: false
      },
      animations: {
        enabled: true,
        speed: 1500,
        animateGradually: {
          enabled: true,
          delay: 300
        }
      },
      dropShadow: {
        enabled: true,
        top: 0,
        left: 0,
        blur: 10,
        opacity: 0.1
      }
    },
    colors: ['#3B82F6', '#10B981', '#F43F5E'],
    stroke: {
      curve: 'smooth',
      width: 4,
      lineCap: 'round'
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: ['#3B82F6', '#10B981', '#F43F5E'],
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 100]
      }
    },
    markers: {
      size: 6,
      colors: ['#3B82F6', '#10B981', '#F43F5E'],
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: {
        size: 10,
        sizeOffset: 3
      }
    },
    grid: {
      show: true,
      borderColor: 'rgba(0,0,0,0.05)',
      strokeDashArray: 4,
      padding: {
        left: 20,
        right: 20
      },
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    xaxis: {
      type: 'datetime',
      categories: [
        '2024-01-01', 
        '2024-01-02', 
        '2024-01-03', 
        '2024-01-04', 
        '2024-01-05', 
        '2024-01-06', 
        '2024-01-07'
      ],
      labels: {
        format: 'dd MMM',
        style: {
          colors: '#888',
          fontSize: '10px'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        formatter: function(val) {
          return val.toFixed(0)
        },
        style: {
          colors: '#888',
          fontSize: '10px'
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      theme: 'dark',
      x: {
        format: 'dd MMM yyyy'
      },
      y: {
        formatter: function(val, { series, seriesIndex, dataPointIndex }) {
          return `${series[seriesIndex][dataPointIndex]}`
        },
        title: {
          formatter: (seriesName) => seriesName
        }
      },
      marker: {
        show: true
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      offsetX: 40,
      labels: {
        colors: '#888'
      }
    }
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
    <div className="space-y-6 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white w-full text-center sm:text-left">Панель администратора</h1>
        <Select
          label="Период"
          selectedKeys={[selectedPeriod]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string
            setSelectedPeriod(selected)
          }}
          className="w-full sm:max-w-xs"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 100 
          }}
        >
          <Card className="h-full dark:bg-gray-800/70 bg-white/70 backdrop-blur-md">
            <CardHeader className="text-md sm:text-lg font-semibold text-gray-700 dark:text-white">Активность пользователей</CardHeader>
            <CardBody>
              <Chart 
                options={{
                  ...userActivityChartOptions,
                  chart: {
                    ...userActivityChartOptions.chart,
                    height: 250 // Reduced height for mobile
                  }
                }} 
                series={userActivityChartOptions.series} 
                type="area" 
                height={250} 
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
            <CardHeader className="text-md sm:text-lg font-semibold text-gray-700 dark:text-white">Нагрузка системы</CardHeader>
            <CardBody>
              <Chart 
                options={{
                  ...systemLoadChartOptions,
                  chart: {
                    ...systemLoadChartOptions.chart,
                    height: 250 // Reduced height for mobile
                  }
                }} 
                series={systemLoadChartOptions.series} 
                type="line" 
                height={250} 
              />
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
