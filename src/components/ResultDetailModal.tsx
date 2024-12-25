'use client'

import React from 'react'
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody,
  ModalFooter,
  Button,
  Progress,
  Chip
} from "@nextui-org/react"

interface ResultDetailModalProps {
  isOpen: boolean
  onOpenChange: () => void
  result: {
    studentName: string
    testName: string
    date: string
    answers: { 
      question: string, 
      selectedOption: string, 
      score: number 
    }[]
    totalScore: number
    interpretation: string
  }
}

export default function ResultDetailModal({ 
  isOpen, 
  onOpenChange, 
  result 
}: ResultDetailModalProps) {
  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage < 33) return 'danger'
    if (percentage < 66) return 'warning'
    return 'success'
  }

  const maxPossibleScore = result.answers.reduce((max, answer) => max + 4, 0)

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      size="4xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Детальный результат теста
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Студент</p>
                  <p className="font-semibold">{result.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Тест</p>
                  <p className="font-semibold">{result.testName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Дата</p>
                  <p className="font-semibold">{result.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Общий балл</p>
                  <Chip 
                    color={getScoreColor(result.totalScore, maxPossibleScore)} 
                    variant="flat"
                  >
                    {result.totalScore} / {maxPossibleScore}
                  </Chip>
                </div>
              </div>

              <Progress
                label="Результат теста"
                value={(result.totalScore / maxPossibleScore) * 100}
                color={getScoreColor(result.totalScore, maxPossibleScore)}
                showValueLabel
                className="mb-4"
              />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ответы на вопросы</h3>
                {result.answers.map((answer, index) => (
                  <div 
                    key={index} 
                    className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700"
                  >
                    <p className="font-medium mb-2">{answer.question}</p>
                    <div className="flex justify-between items-center">
                      <p>{answer.selectedOption}</p>
                      <Chip 
                        size="sm" 
                        color={answer.score > 2 ? 'warning' : 'success'}
                        variant="flat"
                      >
                        {answer.score} баллов
                      </Chip>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Интерпретация результатов</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {result.interpretation}
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={onClose}>
                Закрыть
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
