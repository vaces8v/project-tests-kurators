'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { 
  Select, 
  SelectItem,
  Button,
  RadioGroup,
  Radio
} from "@nextui-org/react"

interface Student {
  id: string
  name: string
}

interface Question {
  id: string
  text: string
  options: { id: string; text: string; score: number }[]
}

export default function StudentTestPage() {
  const [students] = useState<Student[]>([
    { id: '1', name: 'Иванов Иван' },
    { id: '2', name: 'Петрова Анна' },
    { id: '3', name: 'Смирнов Петр' }
  ])

  const [questions] = useState<Question[]>([
    {
      id: '1',
      text: 'Как часто вы чувствуете себя напряженным?',
      options: [
        { id: 'a', text: 'Редко', score: 1 },
        { id: 'b', text: 'Иногда', score: 2 },
        { id: 'c', text: 'Часто', score: 3 },
        { id: 'd', text: 'Постоянно', score: 4 }
      ]
    },
    {
      id: '2',
      text: 'Как вы оцениваете свое эмоциональное состояние?',
      options: [
        { id: 'a', text: 'Спокойное', score: 1 },
        { id: 'b', text: 'Умеренно напряженное', score: 2 },
        { id: 'c', text: 'Напряженное', score: 3 },
        { id: 'd', text: 'Крайне напряженное', score: 4 }
      ]
    }
  ])

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [testStarted, setTestStarted] = useState(false)

  const [themeTransition, setThemeTransition] = useState(false)
  const { theme, setTheme } = useTheme()

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    setThemeTransition(true)

    setTimeout(() => {
      setTheme(theme === 'light' ? 'dark' : 'light')
      setThemeTransition(false)
    }, 300)
  }

  const handleStudentSelect = (keys: React.Key[]) => {
    setSelectedStudent(keys[0] as string)
  }

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }))
  }

  const startTest = () => {
    setTestStarted(true)
  }

  const submitTest = () => {
    // Logic for submitting test results
    console.log('Test submitted', { student: selectedStudent, answers })
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
      className="mx-auto p-6 max-w-full relative bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {themeTransition && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ 
              scale: 5000, 
              opacity: 1,
              transition: { 
                duration: 0.5, 
                ease: "easeInOut" 
              }
            }}
            exit={{ opacity: 0 }}
            className="absolute z-50 bg-white dark:bg-gray-900 rounded-full pointer-events-none transition-colors duration-300"
            style={{
              width: '1px',
              height: '1px',
              left: 'calc(100% - 20px)',
              top: '20px',
              position: 'fixed'
            }}
          />
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4">
        <button 
          onClick={toggleTheme} 
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {theme === 'light' ? <Sun /> : <Moon />}
        </button>
      </div>

      <motion.div 
        className="container mx-auto max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
        variants={containerVariants}
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          Тест: Уровень стресса
        </h1>

        {!testStarted ? (
          <div className="space-y-4">
            <Select
              label="Выберите студента"
              variant="bordered"
              selectedKeys={selectedStudent ? [selectedStudent] : []}
              onSelectionChange={handleStudentSelect as any}
              classNames={{
                trigger: "bg-white dark:bg-gray-700",
                label: "text-gray-600 dark:text-gray-300",
                value: "text-black dark:text-white"
              }}
            >
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name}
                </SelectItem>
              ))}
            </Select>

            <Button 
              color="primary" 
              variant="shadow" 
              fullWidth 
              isDisabled={!selectedStudent}
              onClick={startTest}
            >
              Начать тест
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-center text-gray-700 dark:text-gray-300">
              Студент: {students.find(s => s.id === selectedStudent)?.name}
            </p>

            {questions.map((question) => (
              <div key={question.id} className="mb-4">
                <p className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                  {question.text}
                </p>
                <RadioGroup
                  value={answers[question.id]}
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                >
                  {question.options.map((option) => (
                    <Radio 
                      key={option.id} 
                      value={option.id}
                      classNames={{
                        base: "mb-2",
                        label: "text-gray-700 dark:text-gray-300"
                      }}
                    >
                      {option.text}
                    </Radio>
                  ))}
                </RadioGroup>
              </div>
            ))}

            <Button 
              color="primary" 
              variant="shadow" 
              fullWidth 
              isDisabled={Object.keys(answers).length !== questions.length}
              onClick={submitTest}
            >
              Завершить тест
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
