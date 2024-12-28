'use client'

import React, { useState } from 'react'
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Button,
  Chip,
  Tooltip,
  Select,
  SelectItem,
  Card,
  CardHeader,
  CardBody,
  Divider
} from "@nextui-org/react"
import { 
  FileText, 
  RotateCcw 
} from 'lucide-react'

interface TestResult {
  id: string
  studentName: string
  group: string
  testName: string
  date: string
  score: number
  maxScore: number
}

export default function CuratorResults() {
  const [selectedGroup, setSelectedGroup] = useState('307ИС')

  const groups = [
    { key: '307ИС', label: 'Группа 307ИС' },
    { key: '308ИС', label: 'Группа 308ИС' },
    { key: '309ИС', label: 'Группа 309ИС' }
  ]

  const [results, setResults] = useState<TestResult[]>([
    {
      id: '1',
      studentName: 'Иванов Иван',
      group: '307ИС',
      testName: 'Уровень стресса',
      date: '25.12.2023',
      score: 7,
      maxScore: 10
    },
    {
      id: '2',
      studentName: 'Петрова Анна',
      group: '307ИС',
      testName: 'Психологический профиль',
      date: '24.12.2023',
      score: 8,
      maxScore: 10
    },
    {
      id: '3',
      studentName: 'Смирнов Петр',
      group: '308ИС',
      testName: 'Уровень стресса',
      date: '23.12.2023',
      score: 5,
      maxScore: 10
    }
  ])

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage < 33) return 'danger'
    if (percentage < 66) return 'warning'
    return 'success'
  }

  const resetTestResult = (resultId: string) => {
    // Implement test result reset logic
    console.log(`Resetting test result for ID: ${resultId}`)
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Результаты тестирования</h1>

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
          {groups.map((group) => (
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

        <div className="grid grid-cols-1 gap-6">
          {results.filter(r => r.group === selectedGroup).map((result) => (
            <Card 
              key={result.id} 
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md"
              shadow="sm"
            >
              <CardHeader className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-${getScoreColor(result.score, result.maxScore)}-50 text-${getScoreColor(result.score, result.maxScore)}-600`}>
                    <FileText />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">{result.studentName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Тест: {result.testName}
                    </p>
                  </div>
                </div>
                <Chip 
                  color={getScoreColor(result.score, result.maxScore)} 
                  variant="flat"
                >
                  {result.score} / {result.maxScore}
                </Chip>
              </CardHeader>
              <Divider />
              <CardBody className="flex flex-row justify-between items-center">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Дата: {result.date}
                  </p>
                  <Button 
                    variant="light" 
                    color="primary"
                    onPress={() => resetTestResult(result.id)}
                    className="text-gray-800 dark:text-white hover:text-blue-600"
                  >
                    Сбросить результат
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
