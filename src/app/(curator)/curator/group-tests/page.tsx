'use client'

import React, { useState, useEffect } from 'react'
import { 
  Select, 
  SelectItem, 
} from "@nextui-org/select"
import { Button } from "@nextui-org/button"
import { Card, CardBody, CardHeader } from "@nextui-org/card"
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  firstName: string
  lastName: string
  middleName?: string
}

interface Test {
  id: string
  title: string
  questions: Question[]
}

interface Question {
  id: string
  text: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT'
  options?: QuestionOption[]
}

interface QuestionOption {
  id: string
  text: string
}

interface Response {
  [key: string]: string | string[]
}

export default function GroupTestPage() {
  const [group, setGroup] = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [selectedTest, setSelectedTest] = useState<string | null>(null)
  const [currentTest, setCurrentTest] = useState<Test | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<{ [questionId: string]: string | string[] }>({})
  
  const router = useRouter()

  // Fetch groups the curator is responsible for
  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch('/api/curator/groups')
        const data = await res.json()
        // Assuming first group is selected by default
        if (data.length > 0) {
          setGroup(data[0].id)
        }
      } catch (error) {
        toast.error('Failed to load groups')
      }
    }
    fetchGroups()
  }, [])

  // Fetch students when group is selected
  useEffect(() => {
    if (!group) return

    async function fetchStudents() {
      try {
        const res = await fetch(`/api/curator/groups/${group}/students`)
        const data = await res.json()
        setStudents(data)
      } catch (error) {
        toast.error('Failed to load students')
      }
    }
    fetchStudents()
  }, [group])

  // Fetch tests for the group when group is selected
  useEffect(() => {
    if (!group) return

    async function fetchTests() {
      try {
        const res = await fetch(`/api/curator/groups/${group}/tests`)
        const data = await res.json()
        setTests(data)
      } catch (error) {
        toast.error('Failed to load tests')
      }
    }
    fetchTests()
  }, [group])

  // Load full test details when a test is selected
  useEffect(() => {
    async function fetchTestDetails() {
      if (!selectedTest) return

      try {
        const res = await fetch(`/api/curator/tests/${selectedTest}`)
        const data = await res.json()
        setCurrentTest(data)
        setCurrentQuestionIndex(0)
        setResponses({})
      } catch (error) {
        toast.error('Failed to load test details')
      }
    }
    fetchTestDetails()
  }, [selectedTest])

  const handleResponseChange = (questionId: string, optionId: string) => {
    setResponses(prev => {
      const currentQuestion = currentTest?.questions[currentQuestionIndex]
      if (!currentQuestion) return prev

      switch (currentQuestion.type) {
        case 'SINGLE_CHOICE':
          return { ...prev, [questionId]: optionId }
        case 'MULTIPLE_CHOICE':
          const currentResponses = prev[questionId] as string[] || []
          const updatedResponses = currentResponses.includes(optionId)
            ? currentResponses.filter(id => id !== optionId)
            : [...currentResponses, optionId]
          return { ...prev, [questionId]: updatedResponses }
        default:
          return prev
      }
    })
  }

  const handleNextQuestion = () => {
    if (currentTest && currentQuestionIndex < currentTest.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const submitTest = async () => {
    if (!selectedStudent || !selectedTest) {
      toast.error('Please select a student and test')
      return
    }

    try {
      const res = await fetch('/api/curator/test-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          testId: selectedTest,
          responses: responses
        })
      })

      if (res.ok) {
        toast.success('Test submitted successfully')
        router.push('/curator/test-results')
      } else {
        toast.error('Failed to submit test')
      }
    } catch (error) {
      toast.error('Error submitting test')
    }
  }

  const renderQuestionInput = (question: Question) => {
    switch(question.type) {
      case 'SINGLE_CHOICE':
        return (
          <div className="space-y-2">
            {question.options?.map(option => (
              <div key={option.id} className="flex items-center">
                <input
                  type="radio"
                  id={option.id}
                  name={question.id}
                  value={option.id}
                  checked={responses[question.id] === option.id}
                  onChange={() => handleResponseChange(question.id, option.id)}
                  className="mr-2"
                />
                <label htmlFor={option.id}>{option.text}</label>
              </div>
            ))}
          </div>
        )
      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-2">
            {question.options?.map(option => (
              <div key={option.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={option.id}
                  name={question.id}
                  value={option.id}
                  checked={responses[question.id]?.includes(option.id)}
                  onChange={() => handleResponseChange(question.id, option.id)}
                  className="mr-2"
                />
                <label htmlFor={option.id}>{option.text}</label>
              </div>
            ))}
          </div>
        )
      case 'TEXT':
        return (
          <textarea
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Enter your answer"
          />
        )
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <h2>Test Assignment</h2>
        </CardHeader>
        <CardBody>
          {/* Group Selection */}
          <div className="mb-4">
            <label className="block mb-2">Select Group</label>
            <Select 
              value={group || undefined} 
              onChange={(e) => setGroup(e.target.value)}
            >
              <SelectItem value="group1">Group 1</SelectItem>
              <SelectItem value="group2">Group 2</SelectItem>
            </Select>
          </div>

          {/* Student Selection */}
          <div className="mb-4">
            <label className="block mb-2">Select Student</label>
            <Select 
              value={selectedStudent || undefined} 
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              {students.map(student => (
                <SelectItem key={student.id} value={student.id}>
                  {`${student.lastName} ${student.firstName} ${student.middleName || ''}`}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Test Selection */}
          <div className="mb-4">
            <label className="block mb-2">Select Test</label>
            <Select 
              value={selectedTest || undefined} 
              onChange={(e) => setSelectedTest(e.target.value)}
            >
              {tests.map(test => (
                <SelectItem key={test.id} value={test.id}>
                  {test.title}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Test Taking Interface */}
          {currentTest && (
            <div>
              <Card className="mt-4">
                <CardHeader>
                  <h2>{currentTest.title}</h2>
                </CardHeader>
                <CardBody>
                  {currentTest.questions.length > 0 && (
                    <div>
                      <p className="mb-4">
                        Question {currentQuestionIndex + 1} of {currentTest.questions.length}
                      </p>
                      <div className="mb-4">
                        {currentTest.questions[currentQuestionIndex].text}
                      </div>
                      
                      {renderQuestionInput(currentTest.questions[currentQuestionIndex])}
                      
                      <div className="flex justify-between mt-4">
                        <Button 
                          variant="bordered" 
                          onPress={handlePreviousQuestion}
                          disabled={currentQuestionIndex === 0}
                        >
                          Previous
                        </Button>
                        {currentQuestionIndex === currentTest.questions.length - 1 ? (
                          <Button onClick={submitTest}>Submit Test</Button>
                        ) : (
                          <Button onClick={handleNextQuestion}>Next</Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
