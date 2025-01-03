'use client'

import React, { useState, useEffect } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableColumn, 
  TableHeader, 
  TableRow 
} from "@nextui-org/table"
import { 
  Select, 
  SelectItem 
} from "@nextui-org/select"
import { Card, CardBody, CardHeader } from "@nextui-org/card"
import { Button } from "@nextui-org/button"
import { toast } from 'sonner'

interface TestResult {
  id: string
  student: {
    id: string
    firstName: string
    lastName: string
    middleName?: string
  }
  test: {
    id: string
    title: string
  }
  totalScore: number
  completedAt: string
  responses: {
    id: string
    question: {
      text: string
    }
    selectedOption: string
    score: number
  }[]
}

export default function TestResultsPage() {
  const [groups, setGroups] = useState<{id: string, name: string}[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)

  // Fetch groups
  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch('/api/curator/groups')
        const data = await res.json()
        setGroups(data)
        if (data.length > 0) {
          setSelectedGroup(data[0].id)
        }
      } catch (error) {
        toast.error('Failed to load groups')
      }
    }
    fetchGroups()
  }, [])

  // Fetch test results for selected group
  useEffect(() => {
    if (!selectedGroup) return

    async function fetchTestResults() {
      try {
        const res = await fetch(`/api/curator/test-results?groupId=${selectedGroup}`)
        const data = await res.json()
        setTestResults(data)
      } catch (error) {
        toast.error('Failed to load test results')
      }
    }
    fetchTestResults()
  }, [selectedGroup])

  const renderStudentName = (student: TestResult['student']) => 
    `${student.lastName} ${student.firstName} ${student.middleName || ''}`

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <h2>Test Results</h2>
        </CardHeader>
        <CardBody>
          {/* Group Selection */}
          <div className="mb-4">
            <label className="block mb-2">Select Group</label>
            <Select 
              value={selectedGroup || undefined} 
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              {groups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Test Results Table */}
          <Table 
            aria-label="Test Results Table"
            selectionMode="single"
          >
            <TableHeader>
              <TableColumn key="student">Student</TableColumn>
              <TableColumn key="test">Test</TableColumn>
              <TableColumn key="score">Score</TableColumn>
              <TableColumn key="completedAt">Completed At</TableColumn>
              <TableColumn key="actions">Actions</TableColumn>
            </TableHeader>
            <TableBody 
              items={testResults}
              emptyContent="No test results found"
            >
              {(result) => (
                <TableRow key={result.id}>
                  <TableCell>{renderStudentName(result.student)}</TableCell>
                  <TableCell>{result.test.title}</TableCell>
                  <TableCell>{result.totalScore.toFixed(2)}</TableCell>
                  <TableCell>
                    {new Date(result.completedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant='flat'
                      onPress={() => setSelectedResult(result)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Detailed Result Modal */}
          {selectedResult && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Card className="w-[600px] max-h-[80vh] overflow-y-auto">
                <CardHeader>
                  <h2>
                    Test Result Details for {renderStudentName(selectedResult.student)}
                  </h2>
                </CardHeader>
                <CardBody>
                  <div className="mb-4">
                    <strong>Test:</strong> {selectedResult.test.title}
                  </div>
                  <div className="mb-4">
                    <strong>Total Score:</strong> {selectedResult.totalScore.toFixed(2)}
                  </div>
                  <div className="mb-4">
                    <strong>Completed At:</strong> {new Date(selectedResult.completedAt).toLocaleString()}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableColumn>Question</TableColumn>
                        <TableColumn>Response</TableColumn>
                        <TableColumn>Score</TableColumn>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedResult.responses.map(response => (
                        <TableRow key={response.id}>
                          <TableCell>{response.question.text}</TableCell>
                          <TableCell>
                            {response.selectedOption 
                              ? (typeof response.selectedOption === 'string' 
                                  ? response.selectedOption 
                                  : JSON.stringify(response.selectedOption))
                              : 'No response'}
                          </TableCell>
                          <TableCell>{response.score.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button 
                    className="mt-4" 
                    variant='flat'
                    onPress={() => setSelectedResult(null)}
                  >
                    Close
                  </Button>
                </CardBody>
              </Card>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
