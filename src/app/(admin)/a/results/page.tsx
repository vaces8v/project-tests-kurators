'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Sun, Moon, FileText } from 'lucide-react'
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Chip,
  Button
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
      className="mx-auto p-6 max-w-full relative bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {themeTransition && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ 
              scale: 5000, 
              opacity: 1,
              transition: { 
                duration: 0.5, 
                ease: "easeInOut" 
              }
            }}
            exit={{ opacity: 0 }}
            className="absolute z-50 bg-white dark:bg-gray-900 rounded-full pointer-events-none transition-colors duration-300"
            style={{
              width: '1px',
              height: '1px',
              left: 'calc(100% - 20px)',
              top: '20px',
              position: 'fixed'
            }}
          />
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4">
        <button 
          onClick={toggleTheme} 
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {theme === 'light' ? <Sun /> : <Moon />}
        </button>
      </div>

      <motion.div 
        className="container mx-auto max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
        variants={containerVariants}
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          Результаты тестирования
        </h1>

        <Table 
          aria-label="Результаты тестов"
          color="primary"
          selectionMode="single"
          classNames={{
            th: "text-gray-700 dark:text-white",
            td: "text-gray-700 dark:text-white"
          }}
        >
          <TableHeader>
            <TableColumn>ФИО</TableColumn>
            <TableColumn>Группа</TableColumn>
            <TableColumn>Тест</TableColumn>
            <TableColumn>Дата</TableColumn>
            <TableColumn>Уровень стресса</TableColumn>
            <TableColumn>Психологический профиль</TableColumn>
            <TableColumn>Действия</TableColumn>
          </TableHeader>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.id}>
                <TableCell>{result.studentName}</TableCell>
                <TableCell>{result.group}</TableCell>
                <TableCell>{result.testName}</TableCell>
                <TableCell>{result.date}</TableCell>
                <TableCell>
                  <Chip 
                    color={getStressLevelColor(result.stressLevel)} 
                    variant="flat"
                  >
                    {result.stressLevel}/10
                  </Chip>
                </TableCell>
                <TableCell>{result.psychologicalProfile}</TableCell>
                <TableCell>
                  <Button 
                    isIconOnly 
                    size="sm" 
                    variant="light" 
                    color="primary"
                  >
                    <FileText />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </motion.div>
  )
}
