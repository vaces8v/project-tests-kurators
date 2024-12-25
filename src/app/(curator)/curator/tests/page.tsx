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
  Divider,
  Link
} from "@nextui-org/react"
import { 
  Link2, 
  FileText,
  List
} from 'lucide-react'

interface Test {
  id: string
  name: string
  assignedGroups: string[]
  status: 'active' | 'completed' | 'draft'
  link: string
}

export default function CuratorTests() {
  const [tests] = useState<Test[]>([
    {
      id: '1',
      name: 'Уровень стресса',
      assignedGroups: ['307ИС', '308ИС'],
      status: 'active',
      link: 'http://localhost:3000/test/stress-2023-12'
    },
    {
      id: '2',
      name: 'Психологический профиль',
      assignedGroups: ['307ИС'],
      status: 'completed',
      link: 'http://localhost:3000/test/psych-profile-2023-12'
    }
  ])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusColor = (status: Test['status']) => {
    switch(status) {
      case 'active': return 'success'
      case 'completed': return 'default'
      case 'draft': return 'warning'
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Тесты</h1>

        <div className="grid grid-cols-1 gap-6">
          {tests.map((test) => (
            <Card 
              key={test.id} 
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md"
              shadow="sm"
            >
              <CardHeader className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-${getStatusColor(test.status)}-50 text-${getStatusColor(test.status)}-600`}>
                    <List />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">{test.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Назначен группам: {test.assignedGroups.join(', ')}
                    </p>
                  </div>
                </div>
                <Chip 
                  color={getStatusColor(test.status)} 
                  variant="flat"
                >
                  {test.status === 'active' ? 'Активен' : test.status === 'completed' ? 'Завершен' : 'Черновик'}
                </Chip>
              </CardHeader>
              <Divider />
              <CardBody className="flex flex-row justify-between items-center">
                <div className="flex items-center gap-3">
                  <Link 
                    href={test.link} 
                    target="_blank" 
                    className="text-blue-600 hover:underline"
                  >
                    Ссылка на тест
                  </Link>
                  <Tooltip content="Результаты">
                    <Button 
                      isIconOnly 
                      variant="light" 
                      color="success"
                      isDisabled={test.status !== 'completed'}
                      className="text-gray-600 hover:text-blue-600"
                    >
                      <FileText size={16} />
                    </Button>
                  </Tooltip>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
