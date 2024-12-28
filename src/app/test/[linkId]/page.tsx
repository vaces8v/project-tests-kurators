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
        </CardHeader>
        <CardBody>
          {testAssignment.students && (
            <Select
              label="Select Student"
              placeholder="Choose a student"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              {testAssignment.students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.firstName} {student.lastName}
                </SelectItem>
              ))}
            </Select>
          )}

          {testAssignment.test.questions[currentQuestionIndex] && (
            <div className="mt-4">
              <h2 className="text-xl mb-2">
                {testAssignment.test.questions[currentQuestionIndex].text}
              </h2>
              <RadioGroup
                value={responses[testAssignment.test.questions[currentQuestionIndex].id]?.[0] ?? ''}
                onValueChange={(value) => 
                  handleResponseChange(
                    testAssignment.test.questions[currentQuestionIndex].id, 
                    value
                  )
                }
              >
                {testAssignment.test.questions[currentQuestionIndex].options?.map((option) => (
                  <Radio key={option.id} value={option.id}>
                    {option.text}
                  </Radio>
                ))}
              </RadioGroup>

              <div className="flex justify-between mt-4">
                {currentQuestionIndex > 0 && (
                  <Button 
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  >
                    Previous
                  </Button>
                )}
                {currentQuestionIndex < testAssignment.test.questions.length - 1 ? (
                  <Button 
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    color="primary" 
                    onClick={submitTest}
                    isLoading={isSubmitting}
                    isDisabled={!selectedStudent}
                  >
                    Submit Test
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
