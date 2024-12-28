'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Sun, Moon, FileText, Filter, Search } from 'lucide-react'
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Chip,
  Button,
  Input
} from "@nextui-org/react"

interface TestResult {
  id: string
  studentName: string
  group: string
  testName: string
  date: string
  stressLevel: number
  psychologicalProfile: string
}

export default function ResultsPage() {
  const [results, setResults] = useState<TestResult[]>([
    {
      id: '1',
      studentName: 'Марина Юрьевна',
      group: '307ИС',
      testName: 'Уровень стресса',
      date: '25.12.2023',
      stressLevel: 7,
      psychologicalProfile: 'Средний уровень тревожности'
    },
    {
      id: '2',
      studentName: 'Петрова Анна',
      group: '308ИС',
      testName: 'Психологический профиль',
      date: '24.12.2023',
      stressLevel: 4,
      psychologicalProfile: 'Низкий уровень стресса'
    }
  ])

  const [themeTransition, setThemeTransition] = useState(false)
  const { theme, setTheme } = useTheme()

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    setThemeTransition(true)

    setTimeout(() => {
      setTheme(theme === 'light' ? 'dark' : 'light')
      setThemeTransition(false)
    }, 300)
  }

  const getStressLevelColor = (level: number) => {
    if (level <= 3) return 'success'
    if (level <= 6) return 'warning'
    return 'danger'
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.3,
        type: "spring",
        stiffness: 150
      }
    }
  }

  return (
    <motion.div 
      className="mx-auto p-4 sm:p-6 max-w-full relative bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="container mx-auto w-[95%] sm:w-full sm:max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-8"
        variants={containerVariants}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold text-center sm:text-left text-gray-800 dark:text-white mb-2 sm:mb-0">
            Результаты тестирования
          </h1>
          <div className="flex items-center space-x-2">
            <Button 
              variant="bordered" 
              color="primary" 
              size="sm"
              className="w-full sm:w-auto"
              startContent={<FileText size={16} />}
            >
              Экспорт
            </Button>
            <Button 
              variant="solid" 
              color="primary" 
              size="sm"
              className="w-full sm:w-auto"
              startContent={<Filter size={16} />}
            >
              Фильтр
            </Button>
          </div>
        </div>

        <div className="w-full mb-4">
          <Input
            type="text"
            placeholder="Поиск по результатам"
            size="sm"
            isClearable
            startContent={<Search size={16} />}
            className="w-full"
            classNames={{
              inputWrapper: "bg-gray-100 dark:bg-gray-700 rounded-xl",
              input: "text-xs sm:text-sm"
            }}
          />
        </div>

        <div className="w-full">
          <Table 
            aria-label="Результаты тестов"
            color="primary"
            removeWrapper
            className="w-full"
            classNames={{
              table: "w-full",
              th: "text-gray-700 dark:text-white text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-700",
              td: "text-gray-700 dark:text-white text-[10px] sm:text-xs p-2"
            }}
          >
            <TableHeader>
              <TableColumn className="text-[10px] sm:text-xs">ФИО</TableColumn>
              <TableColumn className="text-[10px] sm:text-xs hidden sm:table-cell">Группа</TableColumn>
              <TableColumn className="text-[10px] sm:text-xs hidden sm:table-cell">Тест</TableColumn>
              <TableColumn className="text-[10px] sm:text-xs hidden sm:table-cell">Дата</TableColumn>
              <TableColumn className="text-[10px] sm:text-xs">Стресс</TableColumn>
              <TableColumn className="text-[10px] sm:text-xs hidden sm:table-cell">Профиль</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Нет результатов">
              {results.map((result) => (
                <TableRow key={result.id} className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <TableCell className="p-2">
                    <div className="flex flex-col">
                      <span className="font-semibold text-[10px] sm:text-xs">{result.studentName}</span>
                      <div className="sm:hidden flex flex-col gap-1 mt-1 text-[9px]">
                        <span className="flex items-center">
                          <span className="mr-2 font-medium">Группа:</span> {result.group}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-2 font-medium">Тест:</span> {result.testName}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-2 font-medium">Дата:</span> {result.date}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-2 font-medium">Профиль:</span> {result.psychologicalProfile}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell p-2">{result.group}</TableCell>
                  <TableCell className="hidden sm:table-cell p-2">{result.testName}</TableCell>
                  <TableCell className="hidden sm:table-cell p-2">{result.date}</TableCell>
                  <TableCell className="p-2">
                    <Chip 
                      color={getStressLevelColor(result.stressLevel)} 
                      variant="flat"
                      size="sm"
                      className="text-[9px] sm:text-xs"
                    >
                      {result.stressLevel}/10
                    </Chip>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell p-2">{result.psychologicalProfile}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </motion.div>
  )
}
