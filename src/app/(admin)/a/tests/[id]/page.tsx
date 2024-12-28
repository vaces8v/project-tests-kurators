'use client'

import { useState, useEffect } from 'react'
import { Button } from '@nextui-org/react'
import { Input } from '@nextui-org/react'
import { Select, SelectItem } from '@nextui-org/react'
import { toast } from 'sonner'

interface TestDetails {
  id: string
  title: string
  description?: string
  curator?: {
    id: string
    name: string
    email: string
  }
  questions: {
    id: string
    text: string
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT'
    options: {
      id: string
      text: string
      score: number
    }[]
  }[]
}

interface Student {
  id: string
  name: string
  email: string
  group: {
    id: string
    name: string
  }
}

export default function TestDetailPage({ params }: { params: { id: string } }) {
  const [test, setTest] = useState<TestDetails | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        const response = await fetch(`/api/tests/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch test details')
        }
        const data = await response.json()
        setTest(data)
      } catch (error) {
        console.error('Error fetching test details:', error)
        toast.error('Failed to load test details', {
          description: error instanceof Error ? error.message : 'Unknown error'
        })
      } finally {
        setIsLoading(false)
      }
    }

    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/students')
        if (!response.ok) {
          throw new Error('Failed to fetch students')
        }
        const data = await response.json()
        setStudents(data)
      } catch (error) {
        console.error('Error fetching students:', error)
        toast.error('Failed to load students', {
          description: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    fetchTestDetails()
    fetchStudents()
  }, [params.id])

  const copyTestLink = () => {
    const testLink = `${window.location.origin}/tests/${params.id}`
    navigator.clipboard.writeText(testLink)
    toast.success('Test link copied to clipboard')
  }

  const startTestAttempt = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student')
      return
    }

    try {
      const response = await fetch('/api/test-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testId: params.id,
          studentId: selectedStudent
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Test attempt started', {
          description: `Test attempt created for the selected student`
        })
        // Можно добавить редирект на страницу прохождения теста
      } else {
        toast.error('Failed to start test attempt', {
          description: data.details || 'Unknown error'
        })
      }
    } catch (error) {
      console.error('Error starting test attempt:', error)
      toast.error('Failed to start test attempt', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!test) {
    return <div>Test not found</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{test.title}</h1>
        <Button onPress={copyTestLink} variant="bordered">
          Copy Test Link
        </Button>
      </div>

      {test.description && (
        <p className="text-gray-600 mb-4">{test.description}</p>
      )}

      {test.curator && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Curator</h2>
          <p>{test.curator.name} ({test.curator.email})</p>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Questions</h2>
        {test.questions.map((question, index) => (
          <div key={question.id} className="border p-4 rounded mb-2">
            <p className="font-medium">{`${index + 1}. ${question.text}`}</p>
            {question.type !== 'TEXT' && (
              <div className="mt-2">
                {question.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <span>{option.text}</span>
                    <span className="text-sm text-gray-500">(Score: {option.score})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Start Test Attempt</h2>
        <div className="flex space-x-4">
          <Select 
            label="Select Student"
            placeholder="Select a student"
            selectedKeys={selectedStudent ? [selectedStudent] : []}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string
              setSelectedStudent(selectedKey)
            }}
          >
            {students.map(student => (
              <SelectItem key={student.id} value={student.id}>
                {student.name} ({student.group.name})
              </SelectItem>
            ))}
          </Select>
          <Button 
            onClick={startTestAttempt}
            disabled={!selectedStudent}
          >
            Start Test
          </Button>
        </div>
      </div>
    </div>
  )
}
