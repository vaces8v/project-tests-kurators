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
  id: string | null
  title: string
  description?: string
  questions: Question[]
  assignedGroups?: string[]
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
  code: string
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
  const [isEditing, setIsEditing] = useState(false)
  const [editingTestId, setEditingTestId] = useState<string | null>(null)
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
    isOpen: isCreateTestModalOpen, 
    onOpen: onCreateTestModalOpen, 
    onOpenChange: onCreateTestModalOpenChange 
  } = useDisclosure()

  const onCreateTestModalOpenHandler = () => {
    setNewTest({
      title: '',
      description: '',
      questions: [],
      assignedGroups: []
    })
    onCreateTestModalOpen()
  }

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

  const [testToDelete, setTestToDelete] = useState<Test | null>(null)

  const { 
    isOpen: isDeleteConfirmationOpen, 
    onOpen: onDeleteConfirmationOpen, 
    onOpenChange: onDeleteConfirmationOpenChange 
  } = useDisclosure()

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  const confirmDeleteTest = (test: Test) => {
    setTestToDelete(test)
    onDeleteConfirmationOpen()
  }

  const handleDeleteTest = async () => {
    if (!testToDelete) return

    await deleteTest(typeof testToDelete.id === 'string' ? testToDelete.id : '')
    setTestToDelete(null)
    onDeleteConfirmationOpenChange()
  }

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
        const response = await fetch('/api/admin/groups')
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

      // Validate questions
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
      });

      const payload = {
        title: newTest.title,
        description: newTest.description || '',
        questions: validatedQuestions,
        assignedGroups: newTest.assignedGroups || []
      }

      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      // Improved error handling
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error response:', errorText)
        
        toast.error('Test Creation Failed', {
          description: `Server responded with status ${response.status}: ${errorText}`,
          duration: 5000
        })
        return
      }

      const responseData = await response.json()

      if (responseData) {
        setTests(prev => [...prev, responseData])
        // Reset form
        setNewTest({
          title: '',
          description: '',
          questions: [],
          assignedGroups: []
        })
        onCreateTestModalOpenChange()
        toast.success('Test created successfully')
      } else {
        toast.error('Test Creation Failed', {
          description: 'Received empty response from server',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Unexpected error during test creation:', error)
      
      toast.error('Test Creation Failed', {
        description: error instanceof Error ? error.message : String(error),
        duration: 5000
      })
    }
  }

  const editTest = async (test: Test) => {
    try {
      // Fetch full test data including questions
      const response = await fetch(`/api/tests/${test.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch test details')
      }
      const fullTest = await response.json()
      
      // Reset the form and set editing mode
      setNewTest({
        title: fullTest.title,
        description: fullTest.description || '',
        questions: fullTest.questions || [],
        assignedGroups: fullTest.assignedGroups || [] // Explicitly set assignedGroups from the fetched test
      })
      setIsEditing(true)
      setEditingTestId(test.id)
      onTestModalOpen()
    } catch (error) {
      toast.error('Failed to load test details', {
        description: error instanceof Error ? error.message : String(error)
      })
    }
  }

  const handleUpdateTest = async (updatedTest: Test) => {
    try {
      // Ensure we have a valid test ID
      if (!updatedTest.id) {
        toast.error('Не указан идентификатор теста')
        return null
      }

      // Validate questions
      const validatedQuestions = (updatedTest.questions || []).map((q, index) => ({
        ...(q.id ? { id: q.id } : {}),
        text: q.text,
        type: q.type,
        order: index + 1,  // Add order based on array index
        options: q.type !== 'TEXT' ? 
          (q.options || []).filter(opt => opt.text.trim() !== '').map((opt, optIndex) => ({
            // Preserve existing option ID if present
            ...(opt.id ? { id: opt.id } : {}),
            text: opt.text,
            score: opt.score || 0,
            order: optIndex + 1  // Add order for options
          })) : 
          []
      }))

      const payload = {
        title: updatedTest.title,
        description: updatedTest.description || '',
        questions: validatedQuestions,
        testAssignments: updatedTest.assignedGroups || []
      }

      const response = await fetch(`/api/tests/${updatedTest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error response:', errorText)
        
        toast.error('Не удалось обновить тест', {
          description: `Ошибка сервера: ${errorText}`,
          duration: 5000
        })
        return null
      }

      const updatedTestResponse = await response.json()

      // Update the tests state
      setTests(prev => prev.map(t => t.id === updatedTest.id ? updatedTestResponse : t))
      
      // Update the current test if we're editing it
      if (editingTestId === updatedTest.id) {
        setNewTest(updatedTestResponse)
      }

      return updatedTestResponse
    } catch (error) {
      console.error('Unexpected error during test update:', error)
      toast.error('Не удалось обновить тест')
      return null
    }
  }

  const updateTest = async () => {
    try {
      if (!editingTestId) return

      // Debug log
      console.log('Updating test with:', {
        title: newTest.title,
        description: newTest.description,
        assignedGroups: newTest.assignedGroups
      })

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

      // Validate questions (same validation as in createTest)
      const validatedQuestions = newTest.questions.map((q, index) => {
        if (!q.text) {
          throw new Error(`Question ${index + 1} is missing text`)
        }

        if (!['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT'].includes(q.type)) {
          throw new Error(`Invalid question type for question ${index + 1}`)
        }

        if (q.type !== 'TEXT') {
          if (!q.options || q.options.length === 0) {
            throw new Error(`Question ${index + 1} must have at least one option`)
          }

          q.options.forEach((opt, optIndex) => {
            if (!opt.text) {
              throw new Error(`Option ${optIndex + 1} in question ${index + 1} is missing text`)
            }
          })
        }

        return {
          // Preserve existing ID if present
          ...(q.id ? { id: q.id } : {}),
          text: q.text,
          type: q.type,
          options: q.type !== 'TEXT' ? 
            q.options.filter(opt => opt.text.trim() !== '').map(opt => ({
              // Preserve existing option ID if present
              ...(opt.id ? { id: opt.id } : {}),
              text: opt.text,
              score: opt.score || 0
            })) : 
            []
        }
      });

      const payload = {
        title: newTest.title,
        description: newTest.description || '',
        questions: validatedQuestions,
        testAssignments: newTest.assignedGroups || []
      }

      const response = await fetch(`/api/tests/${editingTestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error response:', errorText)
        
        toast.error('Test Update Failed', {
          description: `Server responded with status ${response.status}: ${errorText}`,
          duration: 5000
        })
        return
      }

      const updatedTest = await response.json()

      setTests(prev => prev.map(t => t.id === editingTestId ? updatedTest : t))
      resetForm()
      onTestModalOpenChange()
      toast.success('Test updated successfully')
    } catch (error) {
      console.error('Unexpected error during test update:', error)
      
      toast.error('Test Update Failed', {
        description: error instanceof Error ? error.message : String(error),
        duration: 5000
      })
    }
  }

  const deleteTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error response:', errorText)
        
        toast.error('Test Deletion Failed', {
          description: `Server responded with status ${response.status}: ${errorText}`,
          duration: 5000
        })
        return
      }

      // Remove the deleted test from the list
      setTests(prev => prev.filter(test => test.id !== testId))
      toast.success('Test deleted successfully')
    } catch (error) {
      console.error('Unexpected error during test deletion:', error)
      
      toast.error('Test Deletion Failed', {
        description: error instanceof Error ? error.message : String(error),
        duration: 5000
      })
    }
  }

  const resetForm = () => {
    setNewTest({
      title: '',
      description: '',
      questions: [],
      assignedGroups: []
    })
    setIsEditing(false)
    setEditingTestId(null)
  }

  const startEditingQuestion = (question: Question) => {
    console.log('Editing question:', question)
    setCurrentQuestion({ ...question }) 
    setEditingQuestion({ ...question })
    onQuestionModalOpen() 
  }

  const updateEditingQuestion = (updates: Partial<Question>) => {
    if (editingQuestion) {
      setEditingQuestion(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  const saveEditedQuestion = async () => {
    if (!editingQuestion) return

    try {
      // Validate the question
      if (!editingQuestion.text.trim()) {
        toast.error('Question text cannot be empty')
        return
      }

      // Validate options if not a TEXT type question
      if (editingQuestion.type !== 'TEXT') {
        const validOptions = editingQuestion.options.filter(opt => opt.text.trim() !== '')
        
        if (validOptions.length === 0) {
          toast.error('At least one option is required for non-TEXT questions')
          return
        }

        editingQuestion.options = validOptions
      }

      // Find the test that contains this question
      let currentTest = tests.find(test => 
        Array.isArray(test.questions) && 
        test.questions.some(q => q.id === editingQuestion.id)
      )

      if (!currentTest) {
        // If not found in tests, try to find in newTest
        if (newTest.questions.some(q => q.id === editingQuestion.id)) {
          currentTest = { ...newTest, id: editingTestId }
        } else {
          toast.error('Не удалось найти тест для этого вопроса')
          return
        }
      }

      // Create a copy of the current test with updated question
      const updatedQuestions = (currentTest.questions || []).map(q => 
        q.id === editingQuestion.id ? { ...editingQuestion } : q
      )

      // Create a new test object with updated questions
      const updatedTest = {
        ...currentTest,
        questions: updatedQuestions
      }

      // Update the test on the backend
      const result = await handleUpdateTest(updatedTest)

      if (result) {
        // Reset editing state
        setEditingQuestion(null)
        onQuestionModalOpenChange() // Close the modal
        toast.success('Вопрос успешно обновлен')
      }
    } catch (error) {
      console.error('Error updating question:', error)
      toast.error('Не удалось обновить вопрос')
    }
  }

  const cancelQuestionEdit = () => {
    setEditingQuestion(null)
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

  const renderQuestionModal = () => (
    <Modal 
      isOpen={isQuestionModalOpen}
      onOpenChange={onQuestionModalOpenChange}
      backdrop="blur"
      size="2xl"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              {editingQuestion ? 'Редактирование вопроса' : 'Создание вопроса'}
            </ModalHeader>
            <ModalBody>
              <Input
                label="Текст вопроса"
                value={editingQuestion ? editingQuestion.text : currentQuestion.text}
                onChange={(e) => {
                  if (editingQuestion) {
                    updateEditingQuestion({ text: e.target.value })
                  } else {
                    setCurrentQuestion(prev => ({
                      ...prev, 
                      text: e.target.value
                    }))
                  }
                }}
              />
              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">Тип вопроса</label>
                <RadioGroup
                  orientation="horizontal"
                  value={editingQuestion ? editingQuestion.type : currentQuestion.type}
                  onValueChange={(value) => {
                    if (editingQuestion) {
                      updateEditingQuestion({ type: value as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT' })
                    } else {
                      setCurrentQuestion(prev => ({
                        ...prev, 
                        type: value as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT',
                        options: value === 'TEXT' ? [] : prev.options
                      }))
                    }
                  }}
                >
                  <Radio value="SINGLE_CHOICE">Один ответ</Radio>
                  <Radio value="MULTIPLE_CHOICE">Несколько ответов</Radio>
                  <Radio value="TEXT">Текстовый ответ</Radio>
                </RadioGroup>
              </div>

              {(editingQuestion && editingQuestion.type === 'SINGLE_CHOICE' || editingQuestion && editingQuestion.type === 'MULTIPLE_CHOICE' || !editingQuestion && currentQuestion.type === 'SINGLE_CHOICE' || !editingQuestion && currentQuestion.type === 'MULTIPLE_CHOICE') && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-md font-semibold">Варианты ответов</h3>
                    <Button 
                      size="sm" 
                      color="primary" 
                      variant="light"
                      onPress={() => {
                        if (editingQuestion) {
                          updateEditingQuestion({ options: [...editingQuestion.options, { text: '', score: 0 }] })
                        } else {
                          addQuestionOption()
                        }
                      }}
                      startContent={<PlusCircle size={16} />}
                    >
                      Добавить вариант
                    </Button>
                  </div>
                  
                  {(editingQuestion ? editingQuestion.options : currentQuestion.options).map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        label={`Вариант ${index + 1}`}
                        variant="bordered"
                        size="sm"
                        value={option.text}
                        onChange={(e) => {
                          if (editingQuestion) {
                            const newOptions = [...editingQuestion.options]
                            newOptions[index] = { ...newOptions[index], text: e.target.value }
                            updateEditingQuestion({ options: newOptions })
                          } else {
                            const newOptions = [...currentQuestion.options]
                            newOptions[index] = { ...newOptions[index], text: e.target.value }
                            setCurrentQuestion(prev => ({...prev, options: newOptions}))
                          }
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
                          if (editingQuestion) {
                            const newOptions = [...editingQuestion.options]
                            newOptions[index] = { 
                              ...newOptions[index], 
                              score: parseFloat(e.target.value) || 0 
                            }
                            updateEditingQuestion({ options: newOptions })
                          } else {
                            const newOptions = [...currentQuestion.options]
                            newOptions[index] = { 
                              ...newOptions[index], 
                              score: parseFloat(e.target.value) || 0 
                            }
                            setCurrentQuestion(prev => ({...prev, options: newOptions}))
                          }
                        }}
                        className="w-24"
                      />
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light"
                        color="danger"
                        onPress={() => {
                          if (editingQuestion) {
                            const newOptions = editingQuestion.options.filter((_, i) => i !== index)
                            updateEditingQuestion({ options: newOptions })
                          } else {
                            const newOptions = currentQuestion.options.filter((_, i) => i !== index)
                            setCurrentQuestion(prev => ({...prev, options: newOptions}))
                          }
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
                onPress={() => {
                  setEditingQuestion(null)
                  onClose()
                }}
              >
                Отмена
              </Button>
              <Button 
                color="primary" 
                onPress={editingQuestion ? saveEditedQuestion : addQuestion}
              >
                {editingQuestion ? 'Сохранить изменения' : 'Добавить вопрос'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
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
          onPress={onCreateTestModalOpenHandler}
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
                  <TableCell className="hidden sm:table-cell">{test.questions.length}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {Array.isArray(test.assignedGroups) ? test.assignedGroups.join(', ') : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light"
                        className="text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        onPress={() => editTest(test)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light" 
                        color="danger"
                        className="text-gray-800 dark:text-white hover:text-red-600 dark:hover:text-red-400"
                        onPress={() => confirmDeleteTest(test)}
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

      {/* Test Editing Modal */}
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
                Редактирование теста
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
                  selectedKeys={new Set(
                    newTest.assignedGroups.map(groupCode => 
                      groups.find(group => group.code === groupCode)?.id || groupCode
                    )
                  )}
                  onSelectionChange={(keys) => setNewTest(prev => ({
                    ...prev, 
                    assignedGroups: keys === 'all' 
                      ? groups.map(group => group.code) 
                      : Array.from(keys).map(key => 
                          groups.find(group => group.id === key)?.code || ''
                        ).filter(code => code !== '')
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
                       {`${group.name} - ${group.code}`}
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
                        setCurrentQuestion({
                          text: '',
                          type: 'SINGLE_CHOICE',
                          options: [{ text: '', score: 0 }]
                        })
                        onQuestionModalOpen()
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
                        <Button 
                          isIconOnly 
                          size="sm" 
                          variant="light"
                          color="primary"
                          onPress={() => startEditingQuestion(question)}
                        >
                          <Edit size={16} />
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
                  onPress={updateTest}
                  size="sm"
                  isDisabled={!newTest.title || newTest.questions.length === 0}
                >
                  Сохранить изменения
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Test Creation Modal */}
      <Modal 
        isOpen={isCreateTestModalOpen}
        backdrop='blur'
        onOpenChange={onCreateTestModalOpenChange}
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
                  selectedKeys={new Set(
                    newTest.assignedGroups.map(groupCode => 
                      groups.find(group => group.code === groupCode)?.id || groupCode
                    )
                  )}
                  onSelectionChange={(keys) => setNewTest(prev => ({
                    ...prev, 
                    assignedGroups: keys === 'all' 
                      ? groups.map(group => group.code) 
                      : Array.from(keys).map(key => 
                          groups.find(group => group.id === key)?.code || ''
                        ).filter(code => code !== '')
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
                      {`${group.name} - ${group.code}`}
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
                        setCurrentQuestion({
                          text: '',
                          type: 'SINGLE_CHOICE',
                          options: [{ text: '', score: 0 }]
                        })
                        onQuestionModalOpen()
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
                        <Button 
                          isIconOnly 
                          size="sm" 
                          variant="light"
                          color="primary"
                          onPress={() => startEditingQuestion(question)}
                        >
                          <Edit size={16} />
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

      {renderQuestionModal()}

      {/* Test Deletion Confirmation Modal */}
      <Modal 
        isOpen={isDeleteConfirmationOpen}
        backdrop='blur'
        onOpenChange={onDeleteConfirmationOpenChange}
        className="text-gray-800 dark:text-white"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-gray-800 dark:text-white text-md sm:text-lg">
                Подтверждение удаления теста
              </ModalHeader>
              <ModalBody>
                <p>Вы уверены, что хотите удалить тест "{testToDelete?.title}"?</p>
                <p className="text-sm text-red-500">
                  Внимание: Это действие приведет к безвозвратному удалению теста, всех его вопросов и результатов.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="default" 
                  variant="light" 
                  onPress={onClose}
                  size="sm"
                >
                  Отмена
                </Button>
                <Button 
                  color="danger" 
                  onPress={handleDeleteTest}
                  size="sm"
                >
                  Удалить
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </motion.div>
  )
}
