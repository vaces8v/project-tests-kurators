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
  Tooltip,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Link,
  Spinner
} from "@nextui-org/react"
import { 
  Link2, 
  FileText,
  List
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { redirect } from 'next/navigation'

interface Test {
  id: string
  title: string
  description?: string
  testAssignments: { group: { name: string } }[]
  name: string
  status: 'ACTIVE' | 'COMPLETED' | 'DRAFT'
  _count?: {
    testAssignments?: number
    testResults?: number
  }
}

export default function CuratorTests() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login')
    }
  })

  const [tests, setTests] = useState<Test[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'CURATOR') {
      toast.error('Unauthorized Access', {
        description: 'You do not have curator privileges'
      })
      redirect('/')
    }

    async function fetchTests() {
      try {
        const response = await fetch('/api/curator/tests')
        const data = await response.json()
        
        if (response.ok) {
          setTests(data)
        } else {
          toast.error('Error fetching tests', {
            description: data.error || 'Something went wrong'
          })
        }
      } catch (error) {
        toast.error('Network Error', {
          description: 'Unable to fetch tests'
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchTests()
    }
  }, [status, session])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Link copied to clipboard')
  }

  const getStatusColor = (status: Test['status']) => {
    switch(status) {
      case 'ACTIVE': return 'success'
      case 'COMPLETED': return 'default'
      case 'DRAFT': return 'warning'
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Тесты</h1>

        {tests.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-300">
            У вас еще нету тестов
          </div>
        ) : (
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
                      <p className="text-lg font-semibold text-gray-800 dark:text-white">{test.title}</p>
                      {test.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {test.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Назначен группам: {test.testAssignments.map(assignment => assignment.group.name).join(', ')}
                      </p>
                    </div>
                  </div>
                  <Chip 
                    color={getStatusColor(test.status)} 
                    variant="flat"
                  >
                    {test.status === 'ACTIVE' ? 'Активен' : 
                     test.status === 'COMPLETED' ? 'Завершен' : 
                     'Черновик'}
                  </Chip>
                </CardHeader>
                <Divider />
                <CardBody className="flex flex-row justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Tooltip content="Результаты">
                      <Button 
                        isIconOnly 
                        variant="light" 
                        color="success"
                        isDisabled={test.status !== 'COMPLETED'}
                        className="text-gray-600 hover:text-blue-600"
                      >
                        <FileText size={16} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Скопировать ссылку на тест">
                      <Button 
                        isIconOnly 
                        variant="light" 
                        color="primary"
                        onPress={() => {
                          const testLink = `${window.location.origin}/test/${test.id}`
                          navigator.clipboard.writeText(testLink)
                          toast.success('Ссылка на тест скопирована', {
                            description: testLink
                          })
                        }}
                        className="text-gray-600 hover:text-blue-600"
                      >
                        <Link2 size={16} />
                      </Button>
                    </Tooltip>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Назначений: {test._count?.testAssignments || 0}
                      {' | '}
                      Результатов: {test._count?.testResults || 0}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
