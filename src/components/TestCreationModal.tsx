'use client'

import React, { useState } from 'react'
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Input,
  Button,
  Textarea,
  Select,
  SelectItem
} from "@nextui-org/react"

interface Question {
  text: string
  options: { text: string; score: number }[]
}

interface TestCreationModalProps {
  isOpen: boolean
  onOpenChange: () => void
  onCreateTest: (test: {
    name: string
    description: string
    questions: Question[]
    assignedGroups: string[]
  }) => void
}

export default function TestCreationModal({ 
  isOpen, 
  onOpenChange, 
  onCreateTest 
}: TestCreationModalProps) {
  const [testName, setTestName] = useState('')
  const [testDescription, setTestDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([
    { 
      text: '', 
      options: [
        { text: '', score: 1 },
        { text: '', score: 2 },
        { text: '', score: 3 }
      ] 
    }
  ])
  const [assignedGroups, setAssignedGroups] = useState<string[]>([])

  const groups = [
    { key: '307ИС', label: '307ИС' },
    { key: '308ИС', label: '308ИС' }
  ]

  const addQuestion = () => {
    setQuestions([
      ...questions, 
      { 
        text: '', 
        options: [
          { text: '', score: 1 },
          { text: '', score: 2 },
          { text: '', score: 3 }
        ] 
      }
    ])
  }

  const updateQuestion = (index: number, field: keyof Question, value: string) => {
    const newQuestions = [...questions]
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    }
    setQuestions(newQuestions)
  }

  const updateQuestionOption = (
    questionIndex: number, 
    optionIndex: number, 
    field: keyof { text: string; score: number }, 
    value: string
  ) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options[optionIndex] = {
      ...newQuestions[questionIndex].options[optionIndex],
      [field]: field === 'text' ? value : Number(value)
    }
    setQuestions(newQuestions)
  }

  const handleCreateTest = () => {
    onCreateTest({
      name: testName,
      description: testDescription,
      questions,
      assignedGroups
    })
    onOpenChange()
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      size="5xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Создание нового теста
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Название теста"
                  variant="bordered"
                  value={testName}
                  onValueChange={setTestName}
                />
                <Select
                  label="Назначить группы"
                  variant="bordered"
                  selectionMode="multiple"
                  selectedKeys={assignedGroups}
                  onSelectionChange={(keys) => setAssignedGroups(Array.from(keys) as string[])}
                >
                  {groups.map((group) => (
                    <SelectItem key={group.key} value={group.key}>
                      {group.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              
              <Textarea
                label="Описание теста"
                variant="bordered"
                value={testDescription}
                onValueChange={setTestDescription}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Вопросы</h3>
                {questions.map((question, questionIndex) => (
                  <div 
                    key={questionIndex} 
                    className="border rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-700"
                  >
                    <Input
                      label={`Вопрос ${questionIndex + 1}`}
                      variant="bordered"
                      value={question.text}
                      onValueChange={(value) => updateQuestion(questionIndex, 'text', value)}
                    />
                    
                    <div className="grid grid-cols-3 gap-3">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="space-y-2">
                          <Input
                            label={`Вариант ${optionIndex + 1}`}
                            variant="bordered"
                            value={option.text}
                            onValueChange={(value) => 
                              updateQuestionOption(questionIndex, optionIndex, 'text', value)
                            }
                          />
                          <Input
                            label="Баллы"
                            type="number"
                            variant="bordered"
                            value={option.score.toString()}
                            onValueChange={(value) => 
                              updateQuestionOption(questionIndex, optionIndex, 'score', value)
                            }
                            min={1}
                            max={4}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="bordered" 
                  fullWidth 
                  onPress={addQuestion}
                >
                  Добавить вопрос
                </Button>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Отмена
              </Button>
              <Button 
                color="primary" 
                onPress={handleCreateTest}
                isDisabled={
                  !testName || 
                  !testDescription || 
                  assignedGroups.length === 0 || 
                  questions.some(q => 
                    !q.text || 
                    q.options.some(opt => !opt.text || opt.score === 0)
                  )
                }
              >
                Создать тест
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
