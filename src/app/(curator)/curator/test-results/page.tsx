'use client'

import React, { useState, useEffect } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableColumn, 
  TableHeader, 
  TableRow 
} from "@nextui-org/table"
import { 
  Select, 
  SelectItem 
} from "@nextui-org/select"
import { Card, CardBody, CardHeader } from "@nextui-org/card"
import { Button } from "@nextui-org/button"
import { toast } from 'sonner'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal"
import * as XLSX from 'xlsx'

interface TestResult {
  id: string
  student: {
    id: string
    firstName: string
    lastName: string
    middleName?: string
  }
  test: {
    id: string
    title: string
    maxScore?: number
  }
  totalScore: number
  completedAt: string
  responses: {
    id: string
    question: {
      text: string
    }
    selectedOption: string
    score: number
  }[]
}

export default function TestResultsPage() {
  const [groups, setGroups] = useState<{id: string, name: string, code: string}[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [resultToReset, setResultToReset] = useState<{id: string, studentName: string} | null>(null)

  // Fetch groups
  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch('/api/curator/groups')
        const data = await res.json()
        setGroups(data)
        // Set the first group as default
        if (data.length > 0) {
          const firstGroupId = data[0].id
          setSelectedGroup(firstGroupId)
        }
      } catch (error) {
        toast.error('Не удалось загрузить группы')
      }
    }
    fetchGroups()
  }, [])

  // Fetch test results for selected group
  useEffect(() => {
    if (!selectedGroup) return

    async function fetchTestResults() {
      try {
        console.log('Fetching test results for group:', selectedGroup)
        const res = await fetch(`/api/curator/test-results?groupId=${selectedGroup}`)
        
        // Log raw response
        const responseText = await res.text()
        console.log('Raw response:', responseText)

        // Try parsing the response
        let data;
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error('Failed to parse response:', parseError)
          toast.error('Ошибка парсинга результатов тестов', {
            description: responseText
          })
          return
        }

        console.log('Parsed test results:', data)
        
        // Additional checks
        if (!data || data.length === 0) {
          console.warn('No test results found for group:', selectedGroup)
          toast.info('Нет результатов тестов для этой группы')
        }
        
        setTestResults(data)
      } catch (error) {
        console.error('Detailed error fetching test results:', error)
        toast.error('Не удалось загрузить результаты тестов', {
          description: error instanceof Error ? error.message : 'Неизвестная ошибка'
        })
      }
    }
    fetchTestResults()
  }, [selectedGroup])

  // Reset test result
  const handleResetResult = async () => {
    if (!resultToReset) return

    try {
      const res = await fetch(`/api/curator/test-results/${resultToReset.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        // Remove the result from the list
        setTestResults(prevResults => 
          prevResults.filter(result => result.id !== resultToReset.id)
        )
        toast.success('Результат теста сброшен')
        setResultToReset(null)
      } else {
        toast.error('Не удалось сбросить результат')
      }
    } catch (error) {
      toast.error('Произошла ошибка при сбросе результата')
    }
  }

  const renderStudentName = (student: TestResult['student']) => 
    `${student.lastName} ${student.firstName} ${student.middleName || ''}`.trim()

  // Color-code result based on performance percentage
  const getResultColor = (result: TestResult) => {
    // Если максимальный балл не указан, используем весь балл как 100%
    const maxScore = result.test.maxScore || result.totalScore
    
    const percentage = (result.totalScore / maxScore) * 100
    
    if (percentage >= 80) return 'bg-success-100/30 backdrop-blur-sm text-success-700'
    if (percentage >= 50) return 'bg-warning-100/30 backdrop-blur-sm text-warning-700'
    return 'bg-danger-100/30 backdrop-blur-sm text-danger-700'
  }

  // Export results to Excel
  const exportToExcel = () => {
    if (testResults.length === 0) {
      toast.error('Нет результатов для экспорта')
      return
    }

    // Найти выбранную группу
    const currentGroup = groups.find(group => group.id === selectedGroup)

    // Prepare data for Excel
    const excelData = testResults.map(result => ({
      'ФИО Студента': renderStudentName(result.student),
      'Название Теста': result.test.title,
      'Балл': result.totalScore,
      'Дата Завершения': new Date(result.completedAt).toLocaleString()
    }))
    
    const worksheet = XLSX.utils.json_to_sheet(excelData, { 
      header: [
        'ФИО Студента', 
        'Название Теста', 
        'Балл', 
        'Дата Завершения'
      ] 
    })
    
    worksheet['!cols'] = [
      { wch: 40 },  // ФИО Студента
      { wch: 30 },  // Название Теста
      { wch: 10 },  // Балл
      { wch: 40 }   // Дата Завершения
    ]

    // Безопасное применение стилей
    const applyStyle = (cell: string, style: object) => {
      if (worksheet[cell]) {
        worksheet[cell].s = style
      }
    }

    // Стили для заголовков
    const headerRowStyle = { 
      font: { bold: true },
      fill: { fgColor: { rgb: "FFC0C0C0" } }  // Серый цвет заливки
    }

    // Стили для баллов
    const getScoreStyle = (result: TestResult) => {
      const maxScore = result.test.maxScore || result.totalScore
      const percentage = (result.totalScore / maxScore) * 100
      
      if (percentage >= 80) return { 
        fill: { 
          fgColor: { rgb: "C6EFCE" },  // Светло-зеленый
          patternType: 'solid' 
        },
        font: { color: { rgb: "006400" } }  // Темно-зеленый текст
      }
      if (percentage >= 50) return { 
        fill: { 
          fgColor: { rgb: "FFEB9C" },  // Светло-оранжевый
          patternType: 'solid' 
        },
        font: { color: { rgb: "9C6500" } }  // Темно-оранжевый текст
      }
      return { 
        fill: { 
          fgColor: { rgb: "FFC7CE" },  // Светло-красный
          patternType: 'solid' 
        },
        font: { color: { rgb: "9C0006" } }  // Темно-красный текст
      }
    }

    // Применение стилей с проверкой
    applyStyle('A1', headerRowStyle)
    applyStyle('B1', headerRowStyle)
    applyStyle('C1', headerRowStyle)
    applyStyle('D1', headerRowStyle)
    applyStyle('E1', headerRowStyle)
    applyStyle('F1', headerRowStyle)

    // Применение стилей для баллов
    testResults.forEach((result, index) => {
      const cellAddress = XLSX.utils.encode_cell({c: 2, r: index + 1})  // Колонка 'Балл'
      const scoreStyle = getScoreStyle(result)
      
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          fill: scoreStyle.fill,
          font: scoreStyle.font
        }
      }
    })

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Результаты Тестов')
    
    // Export file
    XLSX.writeFile(workbook, `Результаты_Группы_${currentGroup?.code || 'Unknown'}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2>Результаты Тестов</h2>
          <Button 
            color="primary" 
            variant="flat"
            onPress={exportToExcel}
            isDisabled={!selectedGroup || testResults.length === 0}
          >
            Экспорт в Excel
          </Button>
        </CardHeader>
        <CardBody>
          {/* Group Selection */}
          <div className="mb-4">
            <label className="block mb-2">Выберите Группу</label>
            <Select 
              value={selectedGroup || undefined} 
              selectedKeys={selectedGroup ? [selectedGroup] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string
                setSelectedGroup(selectedKey)
              }}
              label="Выберите Группу"
              variant="bordered"
            >
              {groups.map(group => (
                <SelectItem 
                  key={group.id} 
                  value={group.id}
                  textValue={`${group.name} (${group.code})`}
                >
                  <div className="flex justify-between">
                    <span>{group.name}</span>
                    <span className="text-default-500 text-small">{group.code}</span>
                  </div>
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Test Results Table */}
          {selectedGroup && (
            <Table 
              aria-label="Таблица Результатов Тестов"
              selectionMode="single"
            >
              <TableHeader>
                <TableColumn key="student">Студент</TableColumn>
                <TableColumn key="test">Тест</TableColumn>
                <TableColumn key="score">Балл</TableColumn>
                <TableColumn key="completedAt">Дата Завершения</TableColumn>
                <TableColumn key="actions">Действия</TableColumn>
              </TableHeader>
              <TableBody 
                items={testResults}
                emptyContent="Результаты тестов не найдены"
              >
                {(result) => (
                  <TableRow key={result.id}>
                    <TableCell>{renderStudentName(result.student)}</TableCell>
                    <TableCell>{result.test.title}</TableCell>
                    <TableCell>
                      <div className={`p-2 rounded ${getResultColor(result)}`}>
                        {result.totalScore.toFixed(2)} 
                        {result.test.maxScore !== undefined && ` / ${result.test.maxScore}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(result.completedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button 
                        color="default"
                        variant='flat'
                        onPress={() => setResultToReset({
                          id: result.id, 
                          studentName: renderStudentName(result.student)
                        })}
                      >
                        Сбросить результат
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Confirmation Modal */}
      <Modal 
        isOpen={!!resultToReset} 
        onOpenChange={() => setResultToReset(null)}
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Подтверждение сброса результата
              </ModalHeader>
              <ModalBody>
                <p>
                  Вы уверены, что хотите сбросить результат теста для студента 
                  <strong> {resultToReset?.studentName}</strong>?
                </p>
                <p className="text-sm text-warning">
                  Это действие нельзя будет отменить.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button 
                  variant="light" 
                  onPress={onClose}
                >
                  Отмена
                </Button>
                <Button 
                  color="danger" 
                  onPress={() => {
                    handleResetResult()
                    onClose()
                  }}
                >
                  Сбросить
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
