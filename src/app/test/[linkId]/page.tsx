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
  Radio
} from '@nextui-org/react'

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
  const [responses, setResponses] = useState<{[key: string]: string[]}>({})
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
          setTestAssignment({
            test: testData.test,
            students: testData.students
          })
        }
      } catch (error) {
        toast.error('Invalid Test Link', {
          description: 'The test link is not valid or has expired'
        })
        router.push('/')
      }
    }

    fetchTestDetails()
  }, [linkId, router])

  const handleResponseChange = (questionId: string, selectedOption: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: [selectedOption]
    }))
  }

  const submitTest = async () => {
    if (!testAssignment || !selectedStudent) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/test-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testId: testAssignment.test.id,
          studentId: selectedStudent,
          responses: Object.entries(responses).map(([questionId, selectedOptions]) => ({
            questionId,
            selectedOption: selectedOptions[0]
          }))
        })
      })

      if (response.ok) {
        toast.success('Test submitted successfully!')
        router.push('/test-completed')
      } else {
        toast.error('Failed to submit test')
      }
    } catch (error) {
      toast.error('Error submitting test')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!testAssignment) return <div>Loading...</div>

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">{testAssignment.test.title}</h1>
          {testAssignment.test.description && (
            <p className="text-gray-600 mt-2">{testAssignment.test.description}</p>
          )}
        </CardHeader>
        <CardBody>
          {!isStarted ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Instructions</h2>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Select your name from the list below</li>
                  <li>Once you start the test, you cannot pause it</li>
                  <li>Answer all questions carefully</li>
                  <li>You can navigate between questions using the Previous and Next buttons</li>
                  <li>Submit your test only when you have reviewed all answers</li>
                </ul>
              </div>

              <Select
                label="Select Your Name"
                placeholder="Choose your name from the list"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="max-w-md"
              >
                {testAssignment.students?.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} {student.middleName ? `${student.middleName} ` : ''}
                  </SelectItem>
                )) || []}
              </Select>

              <Button 
                color="primary"
                className="w-full max-w-md"
                onPress={() => {
                  if (!selectedStudent) {
                    toast.error('Please select your name before starting')
                    return
                  }
                  setIsStarted(true)
                }}
              >
                Start Test
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <div className="mb-4 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {testAssignment.test.questions.length}
                </span>
                <span className="text-sm text-gray-600">
                  Progress: {Math.round(((currentQuestionIndex + 1) / testAssignment.test.questions.length) * 100)}%
                </span>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h2 className="text-xl mb-4">
                  {testAssignment.test.questions[currentQuestionIndex].text}
                </h2>
                
                {testAssignment.test.questions[currentQuestionIndex].type === 'TEXT' ? (
                  <textarea
                    className="w-full p-2 border rounded-lg"
                    rows={4}
                    value={responses[testAssignment.test.questions[currentQuestionIndex].id]?.[0] ?? ''}
                    onChange={(e) => handleResponseChange(
                      testAssignment.test.questions[currentQuestionIndex].id,
                      e.target.value
                    )}
                    placeholder="Enter your answer here..."
                  />
                ) : (
                  <RadioGroup
                    value={responses[testAssignment.test.questions[currentQuestionIndex].id]?.[0] ?? ''}
                    onValueChange={(value) => 
                      handleResponseChange(
                        testAssignment.test.questions[currentQuestionIndex].id, 
                        value
                      )
                    }
                    className="space-y-2"
                  >
                    {testAssignment.test.questions[currentQuestionIndex].options?.map((option) => (
                      <Radio key={option.id} value={option.id} className="p-2">
                        {option.text}
                      </Radio>
                    ))}
                  </RadioGroup>
                )}

                <div className="flex justify-between mt-6">
                  <Button 
                    variant="flat"
                    onPress={() => setCurrentQuestionIndex(prev => prev - 1)}
                    isDisabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  
                  {currentQuestionIndex < testAssignment.test.questions.length - 1 ? (
                    <Button 
                      color="primary"
                      onPress={() => setCurrentQuestionIndex(prev => prev + 1)}
                      isDisabled={!responses[testAssignment.test.questions[currentQuestionIndex].id]}
                    >
                      Next
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
                    >
                      Submit Test
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
