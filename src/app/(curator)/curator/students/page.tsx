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
  Card,
  CardHeader,
  CardBody,
  Divider
} from "@nextui-org/react"
import { 
  FileText, 
  Send 
} from 'lucide-react'

interface Student {
  id: string
  name: string
  group: string
  testStatus: 'not_started' | 'in_progress' | 'completed'
}

export default function CuratorStudents() {
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'Иванов Иван',
      group: '307ИС',
      testStatus: 'not_started'
    },
    {
      id: '2',
      name: 'Петрова Анна',
      group: '307ИС',
      testStatus: 'completed'
    },
    {
      id: '3',
      name: 'Смирнов Петр',
      group: '308ИС',
      testStatus: 'in_progress'
    }
  ])

  const getStatusColor = (status: Student['testStatus']) => {
    switch(status) {
      case 'not_started': return 'default'
      case 'in_progress': return 'warning'
      case 'completed': return 'success'
    }
  }

  const sendTestLink = (student: Student) => {
    // Implement test link sending logic
    console.log(`Sending test link to ${student.name}`)
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Студенты</h1>

        <div className="grid grid-cols-1 gap-6">
          {students.map((student) => (
            <Card 
              key={student.id} 
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md"
              shadow="sm"
            >
              <CardHeader className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-${getStatusColor(student.testStatus)}-50 text-${getStatusColor(student.testStatus)}-600`}>
                    <Divider />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">{student.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Группа: {student.group}
                    </p>
                  </div>
                </div>
                <Chip 
                  color={getStatusColor(student.testStatus)} 
                  variant="flat"
                >
                  {student.testStatus === 'not_started' && 'Не начат'}
                  {student.testStatus === 'in_progress' && 'В процессе'}
                  {student.testStatus === 'completed' && 'Завершен'}
                </Chip>
              </CardHeader>
              <Divider />
              <CardBody className="flex flex-row justify-between items-center">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="light" 
                    color="primary"
                    onClick={() => sendTestLink(student)}
                    className="text-gray-800 dark:text-white hover:text-blue-600"
                  >
                    Отправить ссылку
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
