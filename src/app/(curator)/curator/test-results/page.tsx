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
  const [groups, setGroups] = useState<{id: string, name: string}[]>([])
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
          setSelectedGroup(data[0].id)
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
        const res = await fetch(`/api/curator/test-results?groupId=${selectedGroup}`)
        const data = await res.json()
        setTestResults(data)
      } catch (error) {
        toast.error('Не удалось загрузить результаты тестов')
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

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <h2>Результаты Тестов</h2>
        </CardHeader>
        <CardBody>
          {/* Group Selection */}
          <div className="mb-4">
            <label className="block mb-2">Выберите Группу</label>
            <Select 
              value={selectedGroup || undefined} 
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              {groups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Test Results Table */}
          <Table 
            aria-label="Таблица Результатов Тестов"
            selectionMode="single"
          >
            <TableHeader>
              <TableColumn key="student">Студент</TableColumn>
              <TableColumn key="test">Тест</TableColumn>
              <TableColumn key="score">Оценка</TableColumn>
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
                  <TableCell>{result.totalScore.toFixed(2)}</TableCell>
                  <TableCell>
                    {new Date(result.completedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button 
                      color="danger"
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
