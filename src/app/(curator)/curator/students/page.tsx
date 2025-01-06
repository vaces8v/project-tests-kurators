'use client'

import React, { useState, useEffect } from 'react'
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Select,
  SelectItem,
  Input,
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button,
  useDisclosure,
  Card,
  CardBody,
  Chip
} from "@nextui-org/react"
import { toast } from 'sonner'

interface TestResult {
  id: string
  testName: string
  score: number
  maxScore: number
  passedAt: string
}

interface Student {
  id: string
  name: string
  group: string
  email?: string
  phone?: string
  testResults?: TestResult[] | string[] | undefined
}

interface Group {
  id: string
  code?: string
  name: string
  curatorId?: string
  _count?: {
    testAssignments?: number
    testResults?: number
  }
}

export default function CuratorStudents() {
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  // Fetch curator's groups on component mount
  useEffect(() => {
    const fetchCuratorGroups = async () => {
      try {
        const response = await fetch('/api/curator/groups', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })

        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Error response:', errorText)
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
        }

        const data = await response.json()
        setGroups(data)

        // Improved group selection logic
        if (data.length > 0) {
          // If there's only one group, select it
          // If multiple groups, do not auto-select, let user choose
          if (data.length === 1) {
            setSelectedGroup(data[0].id)
          }
        }
      } catch (error) {
        console.error('Detailed error in fetchCuratorGroups:', error)
        toast.error('Не удалось загрузить группы', {
          description: error instanceof Error ? error.message : 'Проверьте подключение к серверу'
        })
      }
    }

    fetchCuratorGroups()
  }, [])

  // Fetch students when a group is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedGroup) return

      try {
        // Ensure selectedGroup is a string
        const groupId = typeof selectedGroup === 'object' 
          ? (selectedGroup as Group).id 
          : selectedGroup

        const response = await fetch(`/api/curator/groups/${groupId}/students?includeDetails=true`)

        let errorDetails = null
        if (!response.ok) {
          try {
            errorDetails = await response.json()
          } catch {
            const errorText = await response.text()
            errorDetails = { error: 'Unknown Error', details: errorText }
          }
          
          console.error('Students fetch error details:', errorDetails)
          
          // More detailed error handling
          const errorMessage = errorDetails.details 
            ? `${errorDetails.error}: ${errorDetails.details}`
            : 'Не удалось загрузить студентов'
          
          throw new Error(errorMessage)
        }
        
        const data = await response.json()
        
        setStudents(data)
      } catch (error) {
        console.error('Detailed students fetch error:', error)
        toast.error('Ошибка загрузки студентов', {
          description: error instanceof Error 
            ? `${error.message}\n${error.stack || ''}`
            : 'Проверьте подключение к серверу'
        })
      }
    }

    fetchStudents()
  }, [selectedGroup])

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    
    const rows = pastedText.split('\n')
      .map(row => row.trim())
      .filter(row => row !== '')
      .map(row => row.split('\t').map(cell => cell.trim()))

    if (rows.length === 0 || !selectedGroup) return

    const updatedStudents = [...students]

    rows.forEach((row) => {
      let insertIndex = updatedStudents.findIndex(student => 
        !student.name || !student.group
      )

      if (insertIndex === -1) {
        insertIndex = updatedStudents.length
        updatedStudents.push({
          id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: '',
          group: selectedGroup
        })
      }

      if (row[0]) {
        updatedStudents[insertIndex] = {
          ...updatedStudents[insertIndex],
          name: row[0]
        }
      }
    })

    setStudents(updatedStudents)
  }

  const handleStudentChange = (index: number, field: keyof Student, value: string) => {
    const updatedStudents = [...students]
    updatedStudents[index] = {
      ...updatedStudents[index],
      [field]: value
    }
    setStudents(updatedStudents)
  }

  const renderInput = (student: Student, index: number, field: keyof Student, placeholder: string) => (
    <Input
      value={student[field] !== undefined ? String(student[field]) : ''}
      disabled
      onChange={(e) => handleStudentChange(index, field, e.target.value)}
      placeholder={placeholder}
      size="sm"
      classNames={{
        input: "text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors duration-300"
      }}
    />
  )

  const openStudentDetails = (student: Student) => {
    setSelectedStudent(student)
    
    // Fetch test results for the selected student
    const fetchStudentTestResults = async () => {
      try {
        const response = await fetch(`/api/curator/students/${student.id}/test-results`)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Test results fetch error:', errorText)
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
        }

        const testResults = await response.json()
        
        // Update the selected student with fetched test results
        setSelectedStudent(prev => prev ? {
          ...prev,
          testResults: testResults
        } : null)
      } catch (error) {
        console.error('Detailed error in fetchStudentTestResults:', error)
        toast.error('Не удалось загрузить результаты тестов', {
          description: error instanceof Error ? error.message : 'Проверьте подключение к серверу'
        })
      }
    }

    fetchStudentTestResults()
    onOpen()
  }

  return (
    <div 
      className="bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen p-6" 
      onPaste={handlePaste}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Студенты</h1>

        {/* Group Selection */}
        <div className="mb-4 flex items-center space-x-4">
          <Select
            label="Выберите группу"
            placeholder="Выберите группу"
            className="max-w-xs"
            selectedKeys={selectedGroup ? [selectedGroup] : []}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string
              setSelectedGroup(selectedKey)
            }}
          >
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.code ? `${group.code} - ${group.name}` : group.name}
              </SelectItem>
            ))}
          </Select>
        </div>

        {selectedGroup && (
          <Table 
            aria-label="Students table"
            className="w-full"
            classNames={{
              base: "bg-white dark:bg-gray-800",
              th: "bg-blue-50 dark:bg-gray-700 text-gray-800 dark:text-white",
              tr: "hover:bg-gray-50 dark:hover:bg-gray-700"
            }}
            onRowAction={(key) => {
              const student = students.find(s => s.id === key)
              if (student) openStudentDetails(student)
            }}
          >
            <TableHeader>
              <TableColumn>ФИО</TableColumn>
            </TableHeader>
            <TableBody>
              {students.map((student, index) => (
                <TableRow key={student.id}>
                  <TableCell>
                    {renderInput(student, index, 'name', 'Введите ФИО')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Student Details Modal */}
        <Modal 
          isOpen={isOpen} 
          onOpenChange={onOpenChange}
          size="5xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Информация о студенте
                </ModalHeader>
                <ModalBody>
                  {selectedStudent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Personal Information */}
                      <Card>
                        <CardBody>
                          <h2 className="text-xl font-semibold mb-4">Личные данные</h2>
                          <div className="space-y-2">
                            <p><strong>ФИО:</strong> {selectedStudent.name}</p>
                            <p><strong>Группа:</strong> {groups.find(g => g.id === selectedStudent.group)?.code ? 
                              `${groups.find(g => g.id === selectedStudent.group)?.code} - ${groups.find(g => g.id === selectedStudent.group)?.name}` : 
                              selectedStudent.group}</p>
                            {selectedStudent.email && (
                              <p><strong>Email:</strong> {selectedStudent.email}</p>
                            )}
                            {selectedStudent.phone && (
                              <p><strong>Телефон:</strong> {selectedStudent.phone}</p>
                            )}
                          </div>
                        </CardBody>
                      </Card>

                      {/* Test Results */}
                      <Card>
                        <CardBody>
                          <h2 className="text-xl font-semibold mb-4">Результаты тестов</h2>
                          {selectedStudent.testResults && selectedStudent.testResults.length > 0 ? (
                            <Table 
                              aria-label="Test results"
                              classNames={{
                                base: "bg-white dark:bg-gray-800",
                                th: "bg-blue-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                              }}
                            >
                              <TableHeader>
                                <TableColumn>Название теста</TableColumn>
                                <TableColumn>Результат</TableColumn>
                                <TableColumn>Дата</TableColumn>
                              </TableHeader>
                              <TableBody>
                                {selectedStudent.testResults.filter((result): result is TestResult => typeof result !== 'string').map((result) => (
                                  <TableRow key={result.id}>
                                    <TableCell>{result.testName}</TableCell>
                                    <TableCell>
                                      <Chip 
                                        color={
                                          (result.score / result.maxScore) >= 0.7 ? 'success' : 
                                          (result.score / result.maxScore) >= 0.4 ? 'warning' : 
                                          'danger'
                                        }
                                      >
                                        {result.score} / {result.maxScore}
                                      </Chip>
                                    </TableCell>
                                    <TableCell>
                                      {new Date(result.passedAt).toLocaleDateString()}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <p className="text-gray-500">Нет пройденных тестов</p>
                          )}
                        </CardBody>
                      </Card>
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Закрыть
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  )
}
