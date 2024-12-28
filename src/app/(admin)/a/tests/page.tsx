'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Edit, PlusCircle } from 'lucide-react'
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Button,
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure,
  Input,
  Textarea,
  Select,
  SelectItem,
  RadioGroup,
  Radio
} from "@nextui-org/react"
import { toast } from "sonner"

interface Test {
  id: string
  title: string
  description?: string
  questions: number
  assignedGroups: string[]
}

interface Question {
  id?: string
  text: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT'
  options: QuestionOption[]
}

interface QuestionOption {
  id?: string
  text: string
  score: number
}

interface Group {
  id: string
  name: string
}

interface Curator {
  id: string | null
  name: string
  email: string
  role: 'curator'
}

const DEFAULT_CURATOR: Curator = {
  id: null,
  name: 'Куратор не назначен',
  email: '',
  role: 'curator'
}

export default function TestsManagement() {
  const [tests, setTests] = useState<Test[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [newTest, setNewTest] = useState<{
    title: string
    description: string
    questions: Question[]
    assignedGroups: string[]
  }>({
    title: '',
    description: '',
    questions: [],
    assignedGroups: []
  })

  const { 
    isOpen: isTestModalOpen, 
    onOpen: onTestModalOpen, 
    onOpenChange: onTestModalOpenChange 
  } = useDisclosure()

  const { 
    isOpen: isQuestionModalOpen, 
    onOpen: onQuestionModalOpen, 
    onOpenChange: onQuestionModalOpenChange 
  } = useDisclosure()

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    text: '',
    type: 'SINGLE_CHOICE',
    options: [{ text: '', score: 0 }]
  })

  useEffect(() => {
    // Fetch tests
    const fetchTests = async () => {
      try {
        const response = await fetch('/api/tests')
        const data = await response.json()
        setTests(data)
      } catch (error) {
        toast.error('Failed to fetch tests', {
          description: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // Fetch groups
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups')
        const data = await response.json()
        setGroups(data)
      } catch (error) {
        toast.error('Failed to fetch groups', {
          description: error instanceof Error ? error.message : String(error)
        })
      }
    }

    fetchTests()
    fetchGroups()
  }, [])

  const addQuestion = () => {
    setNewTest(prev => ({
      ...prev,
      questions: [...prev.questions, currentQuestion]
    }))
    setCurrentQuestion({
      text: '',
      type: 'SINGLE_CHOICE',
      options: [{ text: '', score: 0 }]
    })
    onQuestionModalOpenChange()
  }

  const addQuestionOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, { text: '', score: 0 }]
    }))
  }

  const createTest = async () => {
    try {
      // Validate required fields
      if (!newTest.title) {
        toast.error('Test title is required')
        return
      }

      // Validate questions
      if (!newTest.questions || newTest.questions.length === 0) {
        toast.error('At least one question is required')
        return
      }

      // Ensure all questions have valid data
      const validatedQuestions = newTest.questions.map((q, index) => {
        // Validate question text
        if (!q.text) {
          throw new Error(`Question ${index + 1} is missing text`)
        }

        // Validate question type
        if (!['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT'].includes(q.type)) {
          throw new Error(`Invalid question type for question ${index + 1}`)
        }

        // Validate options for non-text questions
        if (q.type !== 'TEXT') {
          if (!q.options || q.options.length === 0) {
            throw new Error(`Question ${index + 1} must have at least one option`)
          }

          // Validate option text
          q.options.forEach((opt, optIndex) => {
            if (!opt.text) {
              throw new Error(`Option ${optIndex + 1} in question ${index + 1} is missing text`)
            }
          })
        }

        return {
          text: q.text,
          type: q.type,
          options: q.type !== 'TEXT' ? 
            q.options.filter(opt => opt.text.trim() !== '').map(opt => ({
              text: opt.text,
              score: opt.score || 0
            })) : 
            []
        }
      })

      const payload = {
        title: newTest.title,
        description: newTest.description || '',
        questions: validatedQuestions,
        assignedGroups: newTest.assignedGroups || []
      }

      console.log('Sending payload:', JSON.stringify(payload, null, 2))

      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      // Log the full response for debugging
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      // Try to get response text before parsing
      const responseText = await response.text()
      console.log('Raw response text:', responseText)

      // Parse the response text
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : null
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        toast.error('Test Creation Failed', {
          description: `Unable to parse server response. Status: ${response.status}. Response: ${responseText}`,
          duration: 5000
        })
        return
      }

      if (response.ok) {
        if (!responseData) {
          toast.error('Test Creation Failed', {
            description: 'Received empty response from server',
            duration: 5000
          })
          return
        }

        setTests(prev => [...prev, responseData])
        // Reset form
        setNewTest({
          title: '',
          description: '',
          questions: [],
          assignedGroups: []
        })
        onTestModalOpenChange()
        toast.success('Test created successfully')
      } else {
        // Handle error response
        if (!responseData) {
          toast.error('Test Creation Failed', {
            description: `Unexpected server error. Status: ${response.status}`,
            duration: 5000
          })
          return
        }

        console.error('Test creation error:', responseData)
        
        if (responseData.invalidGroups) {
          toast.error('Invalid Group IDs', {
            description: `The following group IDs are invalid: ${responseData.invalidGroups.join(', ')}`,
            duration: 5000
          })
        } else {
          toast.error('Test Creation Failed', {
            description: responseData.details || responseData.error || 'Unexpected server error',
            duration: 5000
          })
        }
      }
    } catch (error) {
      console.error('Unexpected error during test creation:', error)
      
      toast.error('Test Creation Failed', {
        description: error instanceof Error ? error.message : String(error),
        duration: 5000
      })
    }
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
      className="space-y-6 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white w-full text-center sm:text-left">Тесты</h1>
        <Button 
          color="primary" 
          onPress={onTestModalOpen}
          className="bg-blue-500 text-white hover:bg-blue-600 w-full sm:w-auto"
          startContent={<Plus size={16} className="min-w-[16px]" />}
          size="sm"
        >
          Создать тест
        </Button>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
        <Table 
          aria-label="Tests table"
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md w-full"
          classNames={{
            th: "bg-blue-50 dark:bg-gray-700 text-gray-700 dark:text-white text-xs sm:text-sm",
            td: "text-gray-700 dark:text-white text-xs sm:text-sm"
          }}
        >
          <TableHeader>
            <TableColumn className="text-gray-800 dark:text-white">Название</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white hidden sm:table-cell">Описание</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white hidden sm:table-cell">Кол-во вопросов</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white hidden sm:table-cell">Группы</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white">Действия</TableColumn>
          </TableHeader>
          <TableBody>
            {tests.length === 0 ? (
              <TableRow>
                <TableCell>-</TableCell>
                <TableCell className="hidden sm:table-cell">-</TableCell>
                <TableCell className="hidden sm:table-cell">-</TableCell>
                <TableCell className="hidden sm:table-cell">-</TableCell>
                <TableCell className="text-center text-gray-800 dark:text-white">
                  Тесты не найдены
                </TableCell>
              </TableRow>
            ) : (
              tests.map((test) => (
                <TableRow key={test.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50">
                  <TableCell>
                    <span className="font-semibold">{test.title}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{test.description || '-'}</TableCell>
                  <TableCell className="hidden sm:table-cell">{test.questions}</TableCell>
                  <TableCell className="hidden sm:table-cell">{test.assignedGroups.join(', ') || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light"
                        className="text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light" 
                        color="danger"
                        className="text-gray-800 dark:text-white hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Test Creation Modal */}
      <Modal 
        isOpen={isTestModalOpen}
        backdrop='blur'
        onOpenChange={onTestModalOpenChange}
        className="text-gray-800 dark:text-white"
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-gray-800 dark:text-white text-md sm:text-lg">
                Создание теста
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label="Название теста"
                  variant="bordered"
                  size="sm"
                  value={newTest.title}
                  onChange={(e) => setNewTest(prev => ({...prev, title: e.target.value}))}
                  className="text-gray-800 dark:text-white"
                  classNames={{
                    label: "text-gray-600 dark:text-gray-300 text-xs sm:text-sm",
                    input: "text-gray-800 dark:text-white text-xs sm:text-sm"
                  }}
                />
                <Textarea
                  label="Описание теста"
                  variant="bordered"
                  size="sm"
                  value={newTest.description}
                  onChange={(e) => setNewTest(prev => ({...prev, description: e.target.value}))}
                  className="text-gray-800 dark:text-white"
                  classNames={{
                    label: "text-gray-600 dark:text-gray-300 text-xs sm:text-sm",
                    input: "text-gray-800 dark:text-white text-xs sm:text-sm"
                  }}
                />
                <Select
                  label="Группы"
                  selectionMode="multiple"
                  variant="bordered"
                  size="sm"
                  selectedKeys={new Set(newTest.assignedGroups)}
                  onSelectionChange={(keys) => setNewTest(prev => ({
                    ...prev, 
                    assignedGroups: Array.from(keys) as string[]
                  }))}
                  className="text-gray-800 dark:text-white"
                  classNames={{
                    trigger: "text-gray-800 dark:text-white text-xs sm:text-sm",
                    label: "text-gray-600 dark:text-gray-300 text-xs sm:text-sm"
                  }}
                >
                  {groups.map((group) => (
                    <SelectItem 
                      key={group.id} 
                      value={group.id}
                      className="text-gray-800 dark:text-white text-xs sm:text-sm"
                    >
                      {group.name}
                    </SelectItem>
                  ))}
                </Select>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-md font-semibold">Вопросы</h3>
                    <Button 
                      size="sm" 
                      color="primary" 
                      variant="light"
                      onPress={() => {
                        onQuestionModalOpen()
                        setCurrentQuestion({
                          text: '',
                          type: 'SINGLE_CHOICE',
                          options: [{ text: '', score: 0 }]
                        })
                      }}
                      startContent={<PlusCircle size={16} />}
                    >
                      Добавить вопрос
                    </Button>
                  </div>
                  
                  {newTest.questions.map((question, index) => (
                    <div 
                      key={index} 
                      className="border rounded p-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{question.text}</p>
                        <p className="text-sm text-gray-500">
                          Тип: {question.type === 'SINGLE_CHOICE' ? 'Один ответ' : 
                                 question.type === 'MULTIPLE_CHOICE' ? 'Несколько ответов' : 
                                 'Текстовый ответ'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          isIconOnly 
                          size="sm" 
                          variant="light"
                          color="danger"
                          onPress={() => {
                            setNewTest(prev => ({
                              ...prev,
                              questions: prev.questions.filter((_, i) => i !== index)
                            }))
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="danger" 
                  variant="light" 
                  onPress={onClose}
                  size="sm"
                >
                  Отмена
                </Button>
                <Button 
                  color="primary" 
                  onPress={createTest}
                  size="sm"
                  isDisabled={!newTest.title || newTest.questions.length === 0}
                >
                  Создать тест
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Question Creation Modal */}
      <Modal 
        isOpen={isQuestionModalOpen}
        backdrop='blur'
        onOpenChange={onQuestionModalOpenChange}
        className="text-gray-800 dark:text-white"
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-gray-800 dark:text-white text-md sm:text-lg">
                Добавление вопроса
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label="Текст вопроса"
                  variant="bordered"
                  size="sm"
                  value={currentQuestion.text}
                  onChange={(e) => setCurrentQuestion(prev => ({...prev, text: e.target.value}))}
                  className="text-gray-800 dark:text-white"
                  classNames={{
                    label: "text-gray-600 dark:text-gray-300 text-xs sm:text-sm",
                    input: "text-gray-800 dark:text-white text-xs sm:text-sm"
                  }}
                />

                <div className="space-y-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">Тип вопроса</label>
                  <RadioGroup
                    orientation="horizontal"
                    value={currentQuestion.type}
                    onValueChange={(value) => setCurrentQuestion(prev => ({
                      ...prev, 
                      type: value as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT',
                      options: value === 'TEXT' ? [] : prev.options
                    }))}
                  >
                    <Radio value="SINGLE_CHOICE">Один ответ</Radio>
                    <Radio value="MULTIPLE_CHOICE">Несколько ответов</Radio>
                    <Radio value="TEXT">Текстовый ответ</Radio>
                  </RadioGroup>
                </div>

                {(currentQuestion.type === 'SINGLE_CHOICE' || currentQuestion.type === 'MULTIPLE_CHOICE') && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-semibold">Варианты ответов</h3>
                      <Button 
                        size="sm" 
                        color="primary" 
                        variant="light"
                        onPress={addQuestionOption}
                        startContent={<PlusCircle size={16} />}
                      >
                        Добавить вариант
                      </Button>
                    </div>
                    
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          label={`Вариант ${index + 1}`}
                          variant="bordered"
                          size="sm"
                          value={option.text}
                          onChange={(e) => {
                            const newOptions = [...currentQuestion.options]
                            newOptions[index] = { ...newOptions[index], text: e.target.value }
                            setCurrentQuestion(prev => ({...prev, options: newOptions}))
                          }}
                          className="flex-grow"
                        />
                        <Input
                          label="Баллы"
                          type="number"
                          variant="bordered"
                          size="sm"
                          value={option.score.toString()}
                          onChange={(e) => {
                            const newOptions = [...currentQuestion.options]
                            newOptions[index] = { 
                              ...newOptions[index], 
                              score: parseFloat(e.target.value) || 0 
                            }
                            setCurrentQuestion(prev => ({...prev, options: newOptions}))
                          }}
                          className="w-24"
                        />
                        <Button 
                          isIconOnly 
                          size="sm" 
                          variant="light"
                          color="danger"
                          onPress={() => {
                            const newOptions = currentQuestion.options.filter((_, i) => i !== index)
                            setCurrentQuestion(prev => ({...prev, options: newOptions}))
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="danger" 
                  variant="light" 
                  onPress={onClose}
                  size="sm"
                >
                  Отмена
                </Button>
                <Button 
                  color="primary" 
                  onPress={addQuestion}
                  size="sm"
                  isDisabled={!currentQuestion.text || 
                    (currentQuestion.type !== 'TEXT' && 
                     (!currentQuestion.options || currentQuestion.options.length === 0 || 
                      currentQuestion.options.some(opt => !opt.text)))}
                >
                  Добавить вопрос
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </motion.div>
  )}
