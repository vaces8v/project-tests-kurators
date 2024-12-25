'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell, 
  Input, 
  Button, 
  Select, 
  SelectItem 
} from "@nextui-org/react"

interface UserData {
  firstName: string
  lastName: string
  middleName?: string
  role?: string
  id?: string
  name?: string
  group?: string
  email?: string
}

export default function GroupPage() {
  const [users, setUsers] = useState<UserData[]>([
    { firstName: '', lastName: '', middleName: '' }
  ])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [selectedCurator, setSelectedCurator] = useState<string>('')
  const [showToaster, setShowToaster] = useState(true)
  const [showCuratorToaster, setShowCuratorToaster] = useState(false)
  const [themeTransition, setThemeTransition] = useState(false)

  const { theme, setTheme } = useTheme()

  const groups = [
    { key: '307ИС', label: '307ИС' },
    { key: '308ИС', label: '308ИС' },
    { key: '309ИС', label: '309ИС' }
  ]

  const curators = [
    { 
      id: '1', 
      name: 'Марина Юрьевна', 
      role: 'curator', 
      group: '307ИС', 
      email: 'ivan.smirnov@college.edu' 
    },
    { 
      id: '2', 
      name: 'Анна Петрова', 
      role: 'curator', 
      group: '308ИС', 
      email: 'anna.petrova@college.edu' 
    },
    { 
      id: '3', 
      name: 'Елена Кузнецова', 
      role: 'curator', 
      group: '309ИС', 
      email: 'elena.kuznetsova@college.edu' 
    }
  ]

  const triggerToaster = () => {
    setShowToaster(true)
    const timer = setTimeout(() => {
      setShowToaster(false)
    }, 3000)
    return () => clearTimeout(timer)
  }

  const triggerCuratorToaster = () => {
    setShowCuratorToaster(true)
    const timer = setTimeout(() => {
      setShowCuratorToaster(false)
    }, 3000)
    return () => clearTimeout(timer)
  }

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const buttonRect = button.getBoundingClientRect()
    const centerX = buttonRect.left + buttonRect.width / 2
    const centerY = buttonRect.top + buttonRect.height / 2

    setThemeTransition(true)

    setTimeout(() => {
      setTheme(theme === 'light' ? 'dark' : 'light')
      setThemeTransition(false)
    }, 300)
  }

  useEffect(() => {
    if (!selectedGroup) {
      setShowToaster(true)
    }
  }, [])

  const handleInputChange = (index: number, field: keyof UserData, value: string) => {
    if (!selectedGroup) {
      triggerToaster()
      return
    }

    const newUsers = [...users]
    newUsers[index] = { ...newUsers[index], [field]: value }
    setUsers(newUsers)
  }

  // Add a new empty row
  const addNewRow = () => {
    if (!selectedGroup) {
      setShowToaster(true)
      return
    }
    
    if (!selectedCurator) {
      triggerCuratorToaster()
      return
    }

    setUsers([...users, { firstName: '', lastName: '', middleName: '' }])
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!selectedGroup) {
      triggerToaster()
      e.preventDefault()
      return
    }

    if (!selectedCurator) {
      triggerCuratorToaster()
      e.preventDefault()
      return
    }

    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    
    const rows = pastedText.split('\n')
      .map(row => row.trim())
      .filter(row => row !== '')
      .map(row => row.split('\t').map(cell => cell.trim()))

    if (rows.length === 0) return

    const parsedUsers: UserData[] = rows.map(row => ({
      lastName: row[0] || '',
      firstName: row[1] || '',
      middleName: row[2] || ''
    }))

    setUsers(parsedUsers)
  }

  const removeRow = (index: number) => {
    if (!selectedGroup) {
      triggerToaster()
      return
    }

    if (!selectedCurator) {
      triggerCuratorToaster()
      return
    }

    if (users.length > 1) {
      const newUsers = users.filter((_, i) => i !== index)
      setUsers(newUsers)
    }
  }

  return (
    <motion.div
      className="mx-auto p-6 max-w-full relative bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen overflow-hidden"
      onPaste={handlePaste}
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
              top: '20px'
            }}
          />
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4">
        <button 
          onClick={toggleTheme} 
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <AnimatePresence mode="wait">
            {theme === 'light' ? (
              <motion.div
                key="sun"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.3 }}
              >
                <Sun />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.3 }}
              >
                <Moon />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 transition-colors duration-300">
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white transition-colors duration-300">Создание пользователей</h1>
        
        <div className="mb-4 flex justify-center gap-4">
          <Select
            label="Выберите группу"
            className="max-w-xs"
            selectedKeys={selectedGroup ? [selectedGroup] : []}
            onChange={(e) => {
              setSelectedGroup(e.target.value)
              setShowToaster(e.target.value ? false : true)
            }}
            classNames={{
              trigger: "bg-white dark:bg-gray-700",
              label: "text-gray-700 dark:text-white"
            }}
          >
            {groups.map((group) => (
              <SelectItem key={group.key} value={group.key}>
                {group.label}
              </SelectItem>
            ))}
          </Select>

          <Select
            label="Выберите куратора"
            className="max-w-xs"
            selectedKeys={selectedCurator ? [selectedCurator] : []}
            onChange={(e) => {
              setSelectedCurator(e.target.value)
            }}
            isDisabled={!selectedGroup}
            classNames={{
              trigger: "bg-white dark:bg-gray-700",
              label: "text-gray-700 dark:text-white"
            }}
          >
            {curators.filter(curator => curator.group === selectedGroup).map((curator) => (
              <SelectItem key={curator.id} value={curator.id}>
                {curator.name}
              </SelectItem>
            ))}
          </Select>
        </div>
        
        <Table 
          aria-label="Users creation table"
          className="w-full"
          removeWrapper
          classNames={{
            base: "bg-white dark:bg-gray-800 transition-colors duration-300",
            th: "text-gray-700 dark:text-white bg-blue-50 dark:bg-gray-700",
            td: "text-gray-700 dark:text-white",
            tr: "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
          }}
        >
          <TableHeader>
            <TableColumn className="text-gray-800 dark:text-white">Фамилия</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white">Имя</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white">Отчество</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white">Действия</TableColumn>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-800 dark:text-white">
                  {!selectedGroup 
                    ? 'Пожалуйста, выберите группу' 
                    : !selectedCurator 
                      ? 'Пожалуйста, выберите куратора' 
                      : 'Пользователи не найдены'}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={user.lastName}
                      onChange={(e) => handleInputChange(index, 'lastName', e.target.value)}
                      placeholder="Введите фамилию"
                      size="sm"
                      isDisabled={!selectedGroup || !selectedCurator}
                      classNames={{
                        input: "text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors duration-300"
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={user.firstName}
                      onChange={(e) => handleInputChange(index, 'firstName', e.target.value)}
                      placeholder="Введите имя"
                      size="sm"
                      isDisabled={!selectedGroup || !selectedCurator}
                      classNames={{
                        input: "text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors duration-300"
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={user.middleName || ''}
                      onChange={(e) => handleInputChange(index, 'middleName', e.target.value)}
                      placeholder="Введите отчество"
                      size="sm"
                      isDisabled={!selectedGroup || !selectedCurator}
                      classNames={{
                        input: "text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors duration-300"
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      color="danger" 
                      variant="light" 
                      size="sm"
                      onClick={() => removeRow(index)}
                      isDisabled={users.length <= 1 || !selectedGroup || !selectedCurator}
                    >
                      Удалить
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex justify-between mt-4">
          <Button 
            color="primary" 
            variant="solid" 
            onClick={addNewRow}
            isDisabled={!selectedGroup || !selectedCurator}
          >
            Добавить строку
          </Button>
          <Button 
            color="success" 
            variant="solid"
            isDisabled={!selectedGroup || !selectedCurator || users.length === 0}
          >
            Сохранить пользователей
          </Button>
        </div>

        <AnimatePresence>
          {showToaster && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, originX: 1 }}
              animate={{ opacity: 1, scale: 1, originX: 1 }}
              exit={{ opacity: 0, scale: 0.5, originX: 1 }}
              transition={{ 
                duration: 0.3, 
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
              className="fixed bottom-4 right-4 
              bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg 
              flex items-center justify-center z-[100] w-auto max-w-md text-center"
            >
              <p className="text-sm font-medium">Пожалуйста, выберите группу перед началом работы</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCuratorToaster && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, originX: 1 }}
              animate={{ opacity: 1, scale: 1, originX: 1 }}
              exit={{ opacity: 0, scale: 0.5, originX: 1 }}
              transition={{ 
                duration: 0.3, 
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
              className="fixed bottom-4 right-4 
              bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg 
              flex items-center justify-center z-[100] w-auto max-w-md text-center"
            >
              <p className="text-sm font-medium">Пожалуйста, выберите куратора перед добавлением пользователей</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}