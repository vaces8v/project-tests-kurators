'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Button,
  RadioGroup,
  Radio,
  Tooltip
} from "@nextui-org/react"
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { mockTestData, MockQuestion } from '@/mockTestData'

export default function StudentTestPage() {
  const { theme, setTheme } = useTheme()
  const [themeTransition, setThemeTransition] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({})

  const questions = mockTestData.questions

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const renderQuestionInput = (question: MockQuestion) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-3 overflow-hidden"
      >
        {question.type === 'multiple-choice' && (
          <RadioGroup
            value={selectedAnswers[question.id] || ''}
            onValueChange={(value) => handleAnswerSelect(question.id, value)}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2 space-y-2"
          >
            {question.options?.map((option, index) => (
              <motion.div
                key={option}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full"
              >
                <Radio
                  value={option}
                  className="w-full"
                  classNames={{
                    base: "group data-[selected=false]:border-gray-700 dark:data-[selected=false]:border-gray-200",
                    wrapper: "group-data-[selected=false]:border-gray-700 dark:group-data-[selected=false]:border-gray-200",
                    label: "text-sm sm:text-base text-gray-700 dark:text-gray-200 break-words"
                  }}
                >
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-200 break-words">{option}</span>
                </Radio>
              </motion.div>
            ))}
          </RadioGroup>
        )}

        {question.type === 'boolean' && (
          <RadioGroup
            value={selectedAnswers[question.id] || ''}
            onValueChange={(value) => handleAnswerSelect(question.id, value)}
            className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Radio value="true" color="success" className="w-full">
                <span className="text-green-600 dark:text-green-400">Yes</span>
              </Radio>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Radio value="false" color="danger" className="w-full">
                <span className="text-red-600 dark:text-red-400">No</span>
              </Radio>
            </motion.div>
          </RadioGroup>
        )}

        {question.type === 'text' && (
          <motion.textarea
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-3 text-sm sm:text-base border-2 border-blue-100 dark:border-gray-600 rounded-lg bg-blue-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 transition-all duration-300"
            value={selectedAnswers[question.id] || ''}
            onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
            placeholder="Type your detailed answer here..."
            rows={4}
          />
        )}
      </motion.div>
    )
  }

  const toggleTheme = () => {
    setThemeTransition(true)

    setTimeout(() => {
      setTheme(theme === 'light' ? 'dark' : 'light')
      setThemeTransition(false)
    }, 300)
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AnimatePresence>
        {themeTransition && (
          <motion.div
            initial={{
              scale: 0,
              opacity: 0.8,
              borderRadius: '50%'
            }}
            animate={{
              scale: 100,
              opacity: [0.8, 0.5, 0],
              transition: {
                duration: 0.8,
                ease: "easeInOut"
              }
            }}
            exit={{ opacity: 0 }}
            className="absolute z-40 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm pointer-events-none"
            style={{
              width: '1px',
              height: '1px',
              left: 'calc(100% - 20px)',
              top: '20px'
            }}
          />
        )}
      </AnimatePresence>

      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50">
        <Tooltip
          content={theme === 'light' ? 'Темная тема' : 'Светлая тема'}
          classNames={{
            content: "text-xs sm:text-sm text-gray-700 dark:text-white bg-white dark:bg-gray-800"
          }}
        >
          <motion.div whileHover={{ rotate: 360 }} whileTap={{ scale: 0.9 }}>
            <Button
              isIconOnly
              variant="light"
              onPress={toggleTheme}
              className="text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 w-8 h-8 sm:w-10 sm:h-10"
            >
              {theme === 'light' ? <Moon className="w-4 h-4 sm:w-6 sm:h-6" /> : <Sun className="w-4 h-4 sm:w-6 sm:h-6" />}
            </Button>
          </motion.div>
        </Tooltip>
      </div>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-2 sm:p-4">
        <motion.div
          className="w-full max-w-md sm:max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-4 sm:p-8 relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.3,
            type: "spring",
            stiffness: 150
          }}
        >
          {/* Progress Indicator */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700">
            <motion.div
              className="h-full bg-blue-500 dark:bg-blue-400"
              initial={{ width: 0 }}
              animate={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-center mb-4 sm:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            {mockTestData.title}
          </h1>

          <p className="text-xs sm:text-base text-center text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 italic">
            {mockTestData.description}
          </p>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 sm:p-6 shadow-inner">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4 text-gray-800 dark:text-white flex items-center justify-between">
                <span>Question {currentQuestionIndex + 1}</span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
              </h2>
              <p className="mb-4 text-sm sm:text-lg text-gray-700 dark:text-gray-300 font-medium">
                {questions[currentQuestionIndex].text}
              </p>

              {renderQuestionInput(questions[currentQuestionIndex])}
            </div>

            <div className="flex flex-col sm:flex-row justify-between mt-4 sm:mt-6 space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                color="default"
                variant="shadow"
                className="w-full transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg text-xs sm:text-base"
                onPress={handlePreviousQuestion}
                isDisabled={currentQuestionIndex === 0}
                startContent={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                }
              >
                Previous
              </Button>

              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  color="success"
                  variant="shadow"
                  className="w-full transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg text-xs sm:text-base"
                  isDisabled={Object.keys(selectedAnswers).length !== questions.length}
                  endContent={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  }
                >
                  Submit Test
                </Button>
              ) : (
                <Button
                  color="primary"
                  variant="shadow"
                  className="w-full transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg text-xs sm:text-base"
                  onPress={handleNextQuestion}
                  isDisabled={!selectedAnswers[questions[currentQuestionIndex].id]}
                  endContent={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  }
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
