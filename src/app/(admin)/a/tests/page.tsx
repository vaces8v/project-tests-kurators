'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Sun, Moon, Plus, Trash2, Edit } from 'lucide-react'
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Button,
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure,
  Input,
  Textarea,
  Select,
  SelectItem
} from "@nextui-org/react"

interface Test {
  id: string
  name: string
  description: string
  questions: number
  assignedGroups: string[]
}

interface Group {
  key: string
  label: string
}

const groups: Group[] = [
  { key: '307ИС', label: '307ИС' },
  { key: '308ИС', label: '308ИС' }
]

export default function TestsManagement() {
  const [tests, setTests] = useState<Test[]>([
    {
      id: '1',
      name: 'Уровень стресса',
      description: 'Тест для оценки психоэмоционального состояния',
      questions: 10,
      assignedGroups: ['307ИС', '308ИС']
    },
    {
      id: '2',
      name: 'Психологический профиль',
      description: 'Диагностика личностных характеристик',
      questions: 15,
      assignedGroups: ['307ИС']
    }
  ])

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
      className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen"
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

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Тесты</h1>
        <Button 
          color="primary" 
          onClick={onOpen}
          className="bg-blue-500 text-white hover:bg-blue-600"
          startContent={<Plus size={16} />}
        >
          Создать тест
        </Button>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Table 
          aria-label="Tests table"
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md"
          classNames={{
            th: "bg-blue-50 dark:bg-gray-700 text-gray-700 dark:text-white",
            td: "text-gray-700 dark:text-white"
          }}
        >
          <TableHeader>
            <TableColumn className="text-gray-800 dark:text-white">Название</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white">Описание</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white">Кол-во вопросов</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white">Группы</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white">Действия</TableColumn>
          </TableHeader>
          <TableBody>
            {tests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-800 dark:text-white">
                  Тесты не найдены
                </TableCell>
              </TableRow>
            ) : (
              tests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell>{test.name}</TableCell>
                  <TableCell>{test.description}</TableCell>
                  <TableCell>{test.questions}</TableCell>
                  <TableCell>{test.assignedGroups.join(', ')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light"
                        className="text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light" 
                        color="danger"
                        className="text-gray-800 dark:text-white hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        className="text-gray-800 dark:text-white"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-gray-800 dark:text-white">
                Создание теста
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Название теста"
                  variant="bordered"
                  className="text-gray-800 dark:text-white"
                  classNames={{
                    label: "text-gray-600 dark:text-gray-300",
                    input: "text-gray-800 dark:text-white"
                  }}
                />
                <Textarea
                  label="Описание"
                  variant="bordered"
                  className="text-gray-800 dark:text-white"
                  classNames={{
                    label: "text-gray-600 dark:text-gray-300",
                    input: "text-gray-800 dark:text-white"
                  }}
                />
                <Select
                  label="Группы"
                  selectionMode="multiple"
                  variant="bordered"
                  className="text-gray-800 dark:text-white"
                  classNames={{
                    trigger: "text-gray-800 dark:text-white",
                    label: "text-gray-600 dark:text-gray-300"
                  }}
                >
                  {groups.map((group) => (
                    <SelectItem 
                      key={group.key} 
                      value={group.key}
                      className="text-gray-800 dark:text-white"
                    >
                      {group.label}
                    </SelectItem>
                  ))}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="danger" 
                  variant="light" 
                  onPress={onClose}
                  className="text-gray-800 dark:text-white"
                >
                  Отмена
                </Button>
                <Button 
                  color="primary" 
                  onPress={onClose}
                  className="text-white"
                >
                  Создать
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </motion.div>
  )
}
