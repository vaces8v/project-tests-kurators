'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Sun, Moon, FileText, Link2 } from 'lucide-react'
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@nextui-org/react"

interface Student {
  id: string
  name: string
  testStatus: 'not_started' | 'in_progress' | 'completed'
}

interface Test {
  id: string
  name: string
  link: string
}

export default function CuratorDashboard() {
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'Иванов Иван', testStatus: 'not_started' },
    { id: '2', name: 'Петрова Анна', testStatus: 'completed' },
    { id: '3', name: 'Смирнов Петр', testStatus: 'in_progress' }
  ])

  const [tests] = useState<Test[]>([
    { 
      id: '1', 
      name: 'Уровень стресса', 
      link: 'http://localhost:3000/test/stress-2023-12' 
    },
    { 
      id: '2', 
      name: 'Психологический профиль', 
      link: 'http://localhost:3000/test/psych-profile-2023-12' 
    }
  ])

  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [themeTransition, setThemeTransition] = useState(false)
  const { theme, setTheme } = useTheme()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    setThemeTransition(true)

    setTimeout(() => {
      setTheme(theme === 'light' ? 'dark' : 'light')
      setThemeTransition(false)
    }, 300)
  }

  const getTestStatusColor = (status: Student['testStatus']) => {
    switch(status) {
      case 'not_started': return 'default'
      case 'in_progress': return 'warning'
      case 'completed': return 'success'
    }
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
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
        className="container mx-auto max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
        variants={containerVariants}
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          Панель куратора
        </h1>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
              Список тестов
            </h2>
            <Table 
              aria-label="Список тестов"
              color="primary"
              selectionMode="single"
            >
              <TableHeader>
                <TableColumn>Название</TableColumn>
                <TableColumn>Действия</TableColumn>
              </TableHeader>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>{test.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          isIconOnly 
                          size="sm" 
                          variant="light" 
                          color="primary"
                          onPress={() => {
                            setSelectedTest(test)
                            onOpen()
                          }}
                        >
                          <Link2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
              Статус студентов
            </h2>
            <Table 
              aria-label="Статус студентов"
              color="primary"
              selectionMode="single"
            >
              <TableHeader>
                <TableColumn>ФИО</TableColumn>
                <TableColumn>Статус теста</TableColumn>
                <TableColumn>Действия</TableColumn>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>
                      <Chip 
                        color={getTestStatusColor(student.testStatus)} 
                        variant="flat"
                      >
                        {student.testStatus === 'not_started' && 'Не начат'}
                        {student.testStatus === 'in_progress' && 'В процессе'}
                        {student.testStatus === 'completed' && 'Завершен'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light" 
                        color="primary"
                        isDisabled={student.testStatus !== 'completed'}
                      >
                        <FileText />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Ссылка на тест
              </ModalHeader>
              <ModalBody>
                <div className="flex items-center gap-2">
                  <p className="text-gray-700 dark:text-gray-300 flex-grow">
                    {selectedTest?.link}
                  </p>
                  <Button 
                    isIconOnly 
                    size="sm" 
                    variant="light" 
                    color="primary"
                    onPress={() => selectedTest && copyToClipboard(selectedTest.link)}
                  >
                    <Link2 />
                  </Button>
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
    </motion.div>
  )
}
