'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Select,
  SelectItem,
  RadioGroup,
  Radio,
  Spinner,
  Checkbox
} from '@nextui-org/react'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  Clock,
  Edit,
  Navigation,
  Check
} from 'lucide-react'

type Question = {
  id: string
  text: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT'
  options?: QuestionOption[]
}

type QuestionOption = {
  id: string
  text: string
  score: number
}

type TestAssignment = {
  test: {
    id: string
    title: string
    description: string
    questions: Question[]
  }
  group?: {
    id: string
    name: string
  }
  students?: any[]
}

export default function TestTakePage() {
  const params = useParams()
  const router = useRouter()
  const linkId = params.linkId as string

  const [testAssignment, setTestAssignment] = useState<TestAssignment | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string | undefined>(undefined)
  const [responses, setResponses] = useState<{ [key: string]: string[] }>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStarted, setIsStarted] = useState(false)

  useEffect(() => {
    async function fetchTestDetails() {
      try {
        // Try fetching via linkId first
        const response = await fetch(`/api/students/tests?uniqueLink=${linkId}`)
        const data = await response.json()

        if (response.ok) {
          setTestAssignment(data)
        } else {
          // Fallback to original test fetch method
          const testResponse = await fetch(`/api/tests/${linkId}`)
          const testData = await testResponse.json()

          // Fetch students for the test's assigned groups
          const studentsResponse = await fetch(`/api/students?groupCodes=${testData.assignedGroups.join(',')}&testId=${testData.id}`)
          const studentsData = await studentsResponse.json()

          // Ensure we have a valid test assignment structure
          setTestAssignment({
            test: testData,
            students: studentsData,
            group: testData.testAssignments?.[0]?.group
          })
        }
      } catch (error) {
        toast.error('Недействительная ссылка на тест', {
          description: 'Ссылка на тест недействительна или истекла'
        })
        router.push('/')
      }
    }

    fetchTestDetails()
  }, [linkId, router])

  const handleResponseChange = (questionId: string, selectedOptions: string[]) => {
    setResponses(prev => {
      const currentResponses = prev[questionId] || []

      // For single choice, replace the entire response
      if (testAssignment?.test.questions.find(q => q.id === questionId)?.type === 'SINGLE_CHOICE') {
        return {
          ...prev,
          [questionId]: selectedOptions
        }
      }

      // For multiple choice, toggle the options
      return {
        ...prev,
        [questionId]: selectedOptions
      }
    })
  }

  const submitTest = async () => {
    if (!testAssignment) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/v2/test-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testId: testAssignment.test.id,
          studentId: selectedStudent || null,
          responses: Object.entries(responses).map(([questionId, selectedOptions]) => ({
            questionId,
            selectedOptions: selectedOptions
          }))
        })
      })

      if (response.ok) {
        toast.success('Тест отправлен успешно!')
        router.push('/test-completed')
      } else {
        const errorData = await response.json()
        toast.error('Не удалось отправить тест', {
          description: errorData.message || 'Пожалуйста, попробуйте еще раз'
        })
      }
    } catch (error) {
      toast.error('Ошибка отправки теста', {
        description: 'Пожалуйста, проверьте ваше интернет-соединение'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!testAssignment) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <h1 className="text-3xl font-bold tracking-tight">
              {testAssignment.test.title}
            </h1>
            {testAssignment.test.description && (
              <p className="text-blue-100 mt-2 text-sm">
                {testAssignment.test.description}
              </p>
            )}
          </div>

          <div className="p-6">
            {!isStarted ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <h2 className="text-xl font-semibold text-blue-900 mb-3">
                    🔍 Инструкция по тесту
                  </h2>
                  <ul className="space-y-2 text-blue-800 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 text-blue-500" />
                      Выберите себя из списка
                    </li>
                    <li className="flex items-center">
                      <Clock className="mr-2 text-blue-500" />
                      После начала теста его нельзя приостановить
                    </li>
                    <li className="flex items-center">
                      <Edit className="mr-2 text-blue-500" />
                      Отвечайте на вопросы внимательно
                    </li>
                    <li className="flex items-center">
                      <Navigation className="mr-2 text-blue-500" />
                      Перемещайтесь между вопросами с помощью кнопок
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 text-blue-500" />
                      Отправляйте тест только после проверки всех ответов
                    </li>
                  </ul>
                </div>

                <Select
                  variant="bordered"
                  label="Выберите себя"
                  placeholder="Выберите имя из списка"
                  selectedKeys={selectedStudent ? [selectedStudent] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string
                    setSelectedStudent(selectedKey)
                  }}
                  renderValue={(items) => {
                    return items.map((item) => {
                      const student = testAssignment.students?.find(s => s.id === item.key)
                      return student
                        ? `${student.firstName} ${student.lastName} ${student.middleName || ''}`.trim()
                        : 'Выберите себя'
                    })
                  }}
                  className="max-w-full"
                  classNames={{
                    label: "text-blue-700 font-semibold",
                    trigger: "border-blue-300 hover:border-blue-500 transition-colors bg-white",
                    value: "text-blue-500 font-medium group-data-[has-value=true]:text-blue-500",
                  }}
                >
                  {testAssignment.students && testAssignment.students.length > 0 ? (
                    testAssignment.students.map((student) => (
                      <SelectItem
                        key={student.id}
                        value={student.id}
                        textValue={`${student.firstName} ${student.lastName} ${student.middleName ? student.middleName : ''}`}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        {student.firstName} {student.lastName} {student.middleName ? `${student.middleName} ` : ''}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem key="default" value="default">
                      Студенты не назначены
                    </SelectItem>
                  )}
                </Select>

                <Button
                  color="primary"
                  className="w-full"
                  size="lg"
                  onPress={() => {
                    if (!selectedStudent) {
                      toast.error('Пожалуйста, выберите свое имя', {
                        description: 'Вы должны выбрать студента перед началом теста'
                      })
                      return
                    }
                    setIsStarted(true)
                  }}
                >
                  Начать тест
                </Button>
              </motion.div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex-grow overflow-auto">
                  {testAssignment && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {currentQuestionIndex < testAssignment.test.questions.length ? (
                        <div className="p-4">
                          <div className="mb-4">
                            <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-lg">
                              <h2 className="text-2xl font-bold text-blue-900 mb-6">
                                {testAssignment.test.questions[currentQuestionIndex].text}
                              </h2>

                              {testAssignment.test.questions[currentQuestionIndex].type === 'TEXT' ? (
                                <textarea
                                  className="w-full p-4 resize-none border border-blue-200 rounded-xl bg-blue-50 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                  rows={4}
                                  value={responses[testAssignment.test.questions[currentQuestionIndex].id]?.[0] ?? ''}
                                  onChange={(e) => handleResponseChange(
                                    testAssignment.test.questions[currentQuestionIndex].id,
                                    [e.target.value]
                                  )}
                                  placeholder="Введите подробный ответ здесь..."
                                />
                              ) : (
                                testAssignment.test.questions[currentQuestionIndex].type === 'SINGLE_CHOICE' ? (
                                  <RadioGroup
                                    value={responses[testAssignment.test.questions[currentQuestionIndex].id]?.[0] ?? ''}
                                    onValueChange={(value) =>
                                      handleResponseChange(
                                        testAssignment.test.questions[currentQuestionIndex].id,
                                        [value]
                                      )
                                    }
                                    className="space-y-6"
                                  >
                                    {testAssignment.test.questions[currentQuestionIndex].options!.map((option, index) => (
                                      <Radio
                                        key={option.id}
                                        value={option.id}
                                        className={`p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors group mb-2 ${index === testAssignment.test.questions[currentQuestionIndex].options!.length - 1 ? 'last:mb-0' : ''}`}
                                      >
                                        <span className="text-blue-900 group-data-[selected=true]:text-blue-600 font-medium">
                                          {option.text}
                                        </span>
                                      </Radio>
                                    ))}
                                  </RadioGroup>
                                ) : (
                                  testAssignment.test.questions[currentQuestionIndex].type === 'MULTIPLE_CHOICE' ? (
                                    <div className="space-y-4">
                                      {testAssignment.test.questions[currentQuestionIndex].options!.map((option) => {
                                        const isSelected = responses[testAssignment.test.questions[currentQuestionIndex].id]?.includes(option.id);
                                        return (
                                          <label
                                            key={option.id}
                                            className={`
                                              flex items-center p-4 rounded-xl border transition-colors 
                                              ${isSelected
                                                ? 'bg-green-50 border-green-300'
                                                : 'bg-white border-gray-200 hover:bg-gray-50'}
                                            `}
                                          >
                                            <Checkbox
                                              isSelected={isSelected}
                                              onChange={(e) => {
                                                const checked = e.target.checked;
                                                const currentResponses = responses[testAssignment.test.questions[currentQuestionIndex].id] || [];
                                                const newResponses = checked
                                                  ? [...currentResponses, option.id]
                                                  : currentResponses.filter(id => id !== option.id);

                                                handleResponseChange(
                                                  testAssignment.test.questions[currentQuestionIndex].id,
                                                  newResponses
                                                );
                                              }}
                                            />
                                            <span className={`
                                              font-medium 
                                              ${isSelected ? 'text-green-900' : 'text-gray-900'}
                                            `}>
                                              {option.text}
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <></>
                                  )
                                )
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between mt-8">
                            <Button
                              variant="light"
                              color="primary"
                              onPress={() => setCurrentQuestionIndex(prev => prev - 1)}
                              isDisabled={currentQuestionIndex === 0}
                              className="px-6"
                            >
                              Назад
                            </Button>

                            {currentQuestionIndex < testAssignment.test.questions.length - 1 ? (
                              <Button
                                color="primary"
                                onPress={() => setCurrentQuestionIndex(prev => prev + 1)}
                                isDisabled={!responses[testAssignment.test.questions[currentQuestionIndex].id]}
                                className="px-6"
                              >
                                Далее
                              </Button>
                            ) : (
                              <Button
                                color="success"
                                onPress={submitTest}
                                isLoading={isSubmitting}
                                isDisabled={
                                  !Object.keys(responses).length ||
                                  Object.keys(responses).length !== testAssignment.test.questions.length
                                }
                                className="px-6"
                              >
                                Отправить тест
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h2 className="text-2xl font-bold text-blue-900 mb-6">
                            Вы достигли конца теста!
                          </h2>
                          <Button
                            color="success"
                            onPress={submitTest}
                            isLoading={isSubmitting}
                            isDisabled={
                              !Object.keys(responses).length ||
                              Object.keys(responses).length !== testAssignment.test.questions.length
                            }
                            className="px-6"
                          >
                            Отправить тест
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
