'use client'

import React, { useState, useEffect } from 'react'
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Button,
  Chip,
  Select,
  SelectItem,
  Tooltip,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Input
} from "@nextui-org/react"
import { 
  FileText, 
  Send 
} from 'lucide-react'
import { toast } from 'sonner'

interface Student {
  id: string
  name: string
  group: string
  testStatus: 'not_started' | 'in_progress' | 'completed'
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
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [testLink, setTestLink] = useState<string>('')

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


        const response = await fetch(`/api/curator/groups/${groupId}/students`)

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

  const getStatusColor = (status: Student['testStatus']) => {
    switch(status) {
      case 'not_started': return 'default'
      case 'in_progress': return 'warning'
      case 'completed': return 'success'
    }
  }

  const sendTestLink = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Выберите студентов для отправки ссылки')
      return
    }

    try {
      const response = await fetch('/api/curator/students/send-test-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentIds: selectedStudents })
      })

      if (!response.ok) {
        throw new Error('Не удалось отправить ссылки')
      }

      const selectedStudentNames = students
        .filter(student => selectedStudents.includes(student.id))
        .map(student => student.name)
        .join(', ')

      toast.success(`Ссылки отправлены студентам: ${selectedStudentNames}`)
      
      // Clear selection after successful send
      setSelectedStudents([])
    } catch (error) {
      console.error('Ошибка отправки ссылок:', error)
      toast.error('Не удалось отправить ссылки', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка'
      })
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

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
          group: selectedGroup,
          testStatus: 'not_started'
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
      value={student[field] || ''}
      disabled
      onChange={(e) => handleStudentChange(index, field, e.target.value)}
      placeholder={placeholder}
      size="sm"
      classNames={{
        input: "text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors duration-300"
      }}
    />
  )

  const generateTestLink = async () => {
    try {
      const response = await fetch('/api/tests/generate-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Не удалось сгенерировать ссылку')
      }

      const data = await response.json()
      
      // Construct full URL
      const fullTestLink = `${window.location.origin}/test/${data.linkId}`
      
      // Copy to clipboard
      await navigator.clipboard.writeText(fullTestLink)
      
      // Set test link state and show toast
      setTestLink(fullTestLink)
      toast.success('Ссылка на тест скопирована в буфер обмена', {
        description: 'Теперь вы можете вставить ссылку в чат студентам'
      })
    } catch (error) {
      console.error('Ошибка генерации ссылки:', error)
      toast.error('Не удалось сгенерировать ссылку', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка'
      })
    }
  }

  return (
    <div 
      className="bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen p-6" 
      onPaste={handlePaste}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Студенты</h1>

        {/* Group Selection and Test Link */}
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
                {group.code || group.name}
              </SelectItem>
            ))}
          </Select>

          <Button 
            color="primary" 
            onClick={generateTestLink}
          >
            Сгенерировать ссылку на тест
          </Button>

          {testLink && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Ссылка скопирована: {testLink}
            </div>
          )}

          {selectedStudents.length > 0 && (
            <Button 
              color="primary" 
              onClick={sendTestLink}
            >
              Отправить ссылку ({selectedStudents.length})
            </Button>
          )}
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
            selectionMode="multiple"
            selectedKeys={new Set(selectedStudents)}
            onSelectionChange={(keys) => {
              if (keys === 'all') {
                setSelectedStudents(students.map(s => s.id))
              } else {
                setSelectedStudents(Array.from(keys) as string[])
              }
            }}
          >
            <TableHeader>
              <TableColumn>ФИО</TableColumn>
              <TableColumn>Статус</TableColumn>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Input
                      value={student.name || ''}
                      disabled
                      placeholder="Введите ФИО"
                      size="sm"
                      classNames={{
                        input: "text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors duration-300"
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      color={
                        student.testStatus === 'completed' ? 'success' : 
                        student.testStatus === 'in_progress' ? 'warning' : 
                        'default'
                      }
                    >
                      {student.testStatus === 'completed' ? 'Завершен' : 
                       student.testStatus === 'in_progress' ? 'В процессе' : 
                       'Не начат'}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
