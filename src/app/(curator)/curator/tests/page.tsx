'use client'

import React, { useState, useEffect } from 'react'
import { 
  Button,
  Tooltip,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@nextui-org/react"
import { 
  Link2, 
  FileText,
  List,
  CheckCircle2,
  XCircle
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
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

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

  const handleStatusChange = async (test: Test, newStatus: 'ACTIVE' | 'COMPLETED' | 'DRAFT') => {
    try {
      const response = await fetch(`/api/curator/tests/${test.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (response.ok) {
        // Update the test status in the local state
        setTests(prevTests => 
          prevTests.map(t => 
            t.id === test.id ? { ...t, status: newStatus } : t
          )
        )
        toast.success('Статус теста обновлен', {
          description: `Тест "${test.title}" ${newStatus === 'COMPLETED' ? 'завершен' : 'активирован'}`
        })
        onOpenChange()
      } else {
        toast.error('Ошибка обновления статуса', {
          description: data.error || 'Не удалось обновить статус теста'
        })
      }
    } catch (error) {
      toast.error('Ошибка сети', {
        description: 'Не удалось обновить статус теста'
      })
    }
  }

  const openStatusChangeModal = (test: Test) => {
    setSelectedTest(test)
    onOpen()
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
                  <Button 
                    variant="light" 
                    color={test.status === 'COMPLETED' ? 'success' : 'warning'}
                    onPress={() => openStatusChangeModal(test)}
                    className="flex items-center gap-2"
                  >
                    {test.status === 'COMPLETED' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    <span className="text-sm">
                      {test.status === 'COMPLETED' ? 'Пройден' : 'Не пройден'}
                    </span>
                  </Button>
                </CardHeader>
                <Divider />
                <CardBody className="flex flex-row justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Tooltip content="Скопировать ссылку на тест">
                      <Button 
                        variant="light" 
                        color="primary"
                        onPress={async () => {
                          try {
                            // Create a test link
                            const response = await fetch('/api/curator/test-links', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                testId: test.id,
                                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
                              })
                            });
                            
                            const data = await response.json();
                            
                            if (!response.ok) {
                              throw new Error(data.error || 'Failed to create test link');
                            }

                            const testLink = `${window.location.origin}/test/${data.linkId}`;
                            await navigator.clipboard.writeText(testLink);
                            toast.success('Ссылка на тест скопирована', {
                              description: testLink
                            });
                          } catch (error) {
                            toast.error('Ошибка при создании ссылки', {
                              description: error instanceof Error ? error.message : 'Не удалось создать ссылку на тест'
                            });
                          }
                        }}
                        className="text-gray-400 hover:text-blue-600 flex items-center gap-2"
                      >
                        <Link2 size={16} />
                        <span className="text-sm">Скопировать ссылку на тест</span>
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

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Изменение статуса теста
              </ModalHeader>
              <ModalBody>
                <p>
                  Вы уверены, что хотите {selectedTest?.status === 'COMPLETED' ? 'отменить завершение' : 'завершить'} тест "{selectedTest?.title}"?
                </p>
                <p className="text-sm text-gray-500">
                  {selectedTest?.status === 'COMPLETED' 
                    ? 'Тест будет возвращен в активный статус.' 
                    : 'Тест будет отмечен как пройденный.'}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Отмена
                </Button>
                <Button 
                  color="primary" 
                  onPress={() => {
                    if (selectedTest) {
                      handleStatusChange(
                        selectedTest, 
                        selectedTest.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED'
                      )
                    }
                  }}
                >
                  Подтвердить
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
