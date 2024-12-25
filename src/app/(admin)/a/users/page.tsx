'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Sun, Moon, UserPlus, Edit, Trash2 } from 'lucide-react'
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
  Input,
  Select,
  SelectItem,
  useDisclosure,
  Chip
} from "@nextui-org/react"

interface User {
  id: string
  name: string
  roles: ('psychologist' | 'curator')[]
  group?: string
  email: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Елена Петрова',
      roles: ['psychologist'],
      email: 'elena.petrova@college.edu'
    },
    {
      id: '2',
      name: 'Марина Юрьевна',
      roles: ['curator', 'psychologist'],
      group: '307ИС',
      email: 'ivanishko@mail.ru'
    }
  ])

  const [groups] = useState([
    { key: '307ИС', label: '307ИС' },
    { key: '308ИС', label: '308ИС' }
  ])

  const [themeTransition, setThemeTransition] = useState(false)
  const { theme, setTheme } = useTheme()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [currentUser, setCurrentUser] = useState<Partial<User>>({})

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    setThemeTransition(true)

    setTimeout(() => {
      setTheme(theme === 'light' ? 'dark' : 'light')
      setThemeTransition(false)
    }, 300)
  }

  const handleAddUser = () => {
    if (currentUser.name && currentUser.email && (currentUser.roles || []).length > 0 && ((currentUser.roles || []).includes('curator') ? currentUser.group : true)) {
      const newUser: User = {
        id: (users.length + 1).toString(),
        name: currentUser.name,
        roles: currentUser.roles || [], 
        email: currentUser.email,
        group: currentUser.group
      }
      setUsers([...users, newUser])
      setCurrentUser({})
      onOpenChange()
    }
  }

  const handleEditUser = (user: User) => {
    setCurrentUser(user)
    onOpen()
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId))
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

      <motion.div 
        className="container mx-auto max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
        variants={containerVariants}
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          Управление пользователями
        </h1>

        <div className="flex justify-end mb-4">
          <Button 
            color="primary" 
            variant="shadow"
            startContent={<UserPlus />}
            onPress={() => {
              setCurrentUser({})
              onOpen()
            }}
            className="text-white"
          >
            Добавить пользователя
          </Button>
        </div>

        <Table 
          aria-label="Список пользователей"
          color="primary"
          selectionMode="single"
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md"
          classNames={{
            th: "bg-blue-50 dark:bg-gray-700 text-gray-800 dark:text-white",
            td: "text-gray-800 dark:text-white"
          }}
        >
          <TableHeader>
            <TableColumn className="text-gray-800 dark:text-white">ФИО</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white">Роль</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white">Email</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white">Группа</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white">Действия</TableColumn>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {user.roles.map((role) => (
                      <Chip 
                        key={role}
                        color={role === 'psychologist' ? 'primary' : 'secondary'}
                        variant="flat"
                        className="text-gray-800 dark:text-white"
                      >
                        {role === 'psychologist' ? 'Психолог' : 'Куратор'}
                      </Chip>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.group || '-'}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </motion.div>

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        className="text-gray-800 dark:text-white"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-gray-800 dark:text-white">
                {currentUser.id ? 'Редактирование пользователя' : 'Добавление пользователя'}
              </ModalHeader>
              <ModalBody>
                <Input
                  label="ФИО"
                  value={currentUser.name || ''}
                  onValueChange={(value) => setCurrentUser(prev => ({ ...prev, name: value }))}
                  variant="bordered"
                  className="text-gray-800 dark:text-white"
                  classNames={{
                    label: "text-gray-600 dark:text-gray-300",
                    input: "text-gray-800 dark:text-white"
                  }}
                />
                <Input
                  label="Email"
                  value={currentUser.email || ''}
                  onValueChange={(value) => setCurrentUser(prev => ({ ...prev, email: value }))}
                  variant="bordered"
                  className="text-gray-800 dark:text-white"
                  classNames={{
                    label: "text-gray-600 dark:text-gray-300",
                    input: "text-gray-800 dark:text-white"
                  }}
                />
                <Select
                  label="Роль"
                  variant="bordered"
                  selectionMode="multiple"
                  selectedKeys={new Set(currentUser.roles || [])}
                  onSelectionChange={(keys) => {
                    const selectedRoles = Array.from(keys) as ('psychologist' | 'curator')[]
                    setCurrentUser(prev => ({ ...prev, roles: selectedRoles }))
                  }}
                  className="text-gray-800 dark:text-white"
                  classNames={{
                    trigger: "text-gray-800 dark:text-white",
                    label: "text-gray-600 dark:text-gray-300"
                  }}
                >
                  <SelectItem 
                    key="psychologist" 
                    value="psychologist"
                    className="text-gray-800 dark:text-white"
                  >
                    Психолог
                  </SelectItem>
                  <SelectItem 
                    key="curator" 
                    value="curator"
                    className="text-gray-800 dark:text-white"
                  >
                    Куратор
                  </SelectItem>
                </Select>
                {(currentUser.roles || []).includes('curator') && (
                  <Select
                    label="Группа"
                    variant="bordered"
                    selectedKeys={currentUser.group ? [currentUser.group] : []}
                    onSelectionChange={(keys) => {
                      const selectedGroup = Array.from(keys)[0] as string
                      setCurrentUser(prev => ({ ...prev, group: selectedGroup }))
                    }}
                    className="text-gray-800 dark:text-white"
                    classNames={{
                      trigger: "text-gray-800 dark:text-white",
                      label: "text-gray-600 dark:text-gray-300"
                    }}
                  >
                    {groups.map((group) => (
                      <SelectItem key={group.key} value={group.key}>
                        {group.label}
                      </SelectItem>
                    ))}
                  </Select>
                )}
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
                  onPress={handleAddUser}
                  isDisabled={
                    !currentUser.name || 
                    !currentUser.email || 
                    (currentUser.roles || []).length === 0 || 
                    ((currentUser.roles || []).includes('curator') && !currentUser.group)
                  }
                  className="text-white"
                >
                  {currentUser.id ? 'Обновить' : 'Создать'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </motion.div>
  )
}
