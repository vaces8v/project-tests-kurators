'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Sun, Moon, UserPlus, Edit, Trash2, RefreshCw } from 'lucide-react'
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
  Chip,
  Tooltip,
} from "@nextui-org/react"
import { toast } from 'sonner'
import Skeleton from '@mui/material/Skeleton';
import { hashPassword } from '@/lib/auth'

interface User {
  id?: string
  name: string
  login: string
  role: 'CURATOR' | 'ADMIN'
  groups?: { id: string; name: string; code?: string }[]
  email?: string
  password?: string
}

interface GroupData {
  key: string
  label: string
  code?: string
  curators?: User[]
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<GroupData[]>([])
  const [loading, setLoading] = useState(true);

  const [themeTransition, setThemeTransition] = useState(false)
  const { theme, setTheme } = useTheme()
  const { 
    isOpen: isUserModalOpen, 
    onOpen: onUserModalOpen, 
    onOpenChange: onUserModalOpenChange 
  } = useDisclosure()
  const { 
    isOpen: isResetPasswordOpen, 
    onOpen: onResetPasswordOpen, 
    onOpenChange: onResetPasswordOpenChange 
  } = useDisclosure()
  const { 
    isOpen: isDeleteUserOpen, 
    onOpen: onDeleteUserOpen, 
    onOpenChange: onDeleteUserOpenChange 
  } = useDisclosure()
  const [currentUser, setCurrentUser] = useState<Partial<User>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8)
  }

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    setThemeTransition(true)
    setTimeout(() => {
      setTheme(theme === 'light' ? 'dark' : 'light')
      setThemeTransition(false)
    }, 300)
  }

  const handleAddUser = async () => {
    // Валидация
    if (!currentUser.name || !currentUser.login || !currentUser.role) {
      toast.error('Заполните все обязательные поля')
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: currentUser.name,
          login: currentUser.login,
          role: currentUser.role,
          email: currentUser.email,
          password: currentUser.password
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось создать пользователя')
      }

      // Обновление списка пользователей
      const newUser = result.user
      setUsers(prev => [...prev, newUser])
      
      toast.success(`Куратор ${newUser.name} создан`, {
        description: 'Назначьте группу в разделе групп'
      })
      
      // Показать сгенерированный пароль
      if (result.temporaryPassword) {
        toast.info(`Временный пароль: ${result.temporaryPassword}`, {
          description: 'Попросите пользователя сменить пароль при первом входе'
        })
      }

      // Сброс формы
      setCurrentUser({})
      onUserModalOpenChange()
    } catch (error) {
      toast.error('Ошибка создания пользователя', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка'
      })
    }
  }

  const handleEditUser = async (user: User) => {
    // Запрет редактирования администраторов
    if (user.role === 'ADMIN') {
      toast.error('Администраторов нельзя редактировать')
      return
    }

    setCurrentUser(user)
    setIsEditing(true)
    onUserModalOpen()
  }

  const handleUpdateUser = async () => {
    if (!currentUser.id || !currentUser.name || !currentUser.login) {
      toast.error('Заполните все обязательные поля')
      return
    }

    // Explicitly handle group detachment
    const groupIds = currentUser.groups?.map(group => group.id) || []
    

    try {
      // Start a transaction to update both user and groups
      const userUpdatePromise = fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: currentUser.id,
          name: currentUser.name,
          login: currentUser.login,
          role: currentUser.role,
          ...(currentUser.email ? { email: currentUser.email } : {}),
          groupIds: groupIds,  // Send ALL group IDs, including removed ones
          detachGroups: true   // Add a flag to explicitly handle group detachment
        })
      })

      // Wait for the update to complete
      const userResponse = await userUpdatePromise
      const result = await userResponse.json()

      if (!userResponse.ok) {
        throw new Error(result.error || 'Не удалось обновить пользователя')
      }

      // Обновление списка пользователей
      setUsers(prev => prev.map(u => 
        u.id === result.id ? {
          ...result,
          groups: result.role === 'CURATOR' 
            ? (result.curatedGroups || []) 
            : (result.groups || [])
        } : u
      ))
      
      toast.success(`Куратор ${result.name} обновлен`)

      // Сброс формы
      setCurrentUser({})
      onUserModalOpenChange()

      // Refresh groups to reflect changes
      fetchInitialData()
    } catch (error) {
      console.error('Update user error:', error)
      toast.error('Ошибка обновления пользователя', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка'
      })
    }
  }

  const handleGroupSelectionChange = (keys: any) => {
    const selectedKeys = Array.from(keys)

    const selectedGroups = groups
      .filter(group => selectedKeys.includes(group.key))
      .map(group => ({ 
        id: group.key,
        name: group.label,
        code: group.code 
      }))
    
    
    setCurrentUser(prev => ({ 
      ...prev, 
      groups: selectedGroups
    }))
  }

  const renderGroupSelection = () => {
    // Separate groups into two categories: current user's groups and other groups
    const currentUserGroupIds = currentUser.groups?.map(g => g.id) || []
    
    const availableGroups = groups.filter(group => 
      !currentUserGroupIds.includes(group.key)
    )
    
    const currentUserGroups = groups.filter(group => 
      currentUserGroupIds.includes(group.key)
    )

    return (
      <div className="space-y-4">
        {currentUserGroups.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Текущие группы
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentUserGroups.map(group => (
                <Chip 
                  key={group.key}
                  color="primary" 
                  variant="flat"
                  onClose={() => {
                    // Remove this group
                    setCurrentUser(prev => ({
                      ...prev,
                      groups: prev.groups?.filter(g => g.id !== group.key) || []
                    }))
                  }}
                >
                  {group.code} - {group.label}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <Select
          label="Добавить группы"
          variant="bordered"
          size="sm"
          placeholder="Выберите группы для добавления"
          selectionMode="multiple"
          selectedKeys={[]}
          onSelectionChange={(keys) => {
            const selectedKeys = Array.from(keys)
            
            // Add new groups to the current user's groups
            const newGroups = groups
              .filter(group => selectedKeys.includes(group.key))
              .map(group => ({ 
                id: group.key, 
                name: group.label,
                code: group.code 
              }))
            
            setCurrentUser(prev => ({
              ...prev,
              groups: [
                ...(prev.groups || []),
                ...newGroups.filter(newGroup => 
                  !prev.groups?.some(existingGroup => existingGroup.id === newGroup.id)
                )
              ]
            }))
          }}
        >
          {availableGroups.map((group) => (
            <SelectItem 
              key={group.key} 
              value={group.key}
              textValue={`${group.code} - ${group.label}`}
            >
              <div className="flex justify-between">
                <span>{group.code}</span>
                <span className="text-gray-400 text-xs">{group.label}</span>
              </div>
            </SelectItem>
          ))}
        </Select>
      </div>
    )
  }

  const confirmDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId)
    
    // Запрет удаления администраторов
    if (user && user.role === 'ADMIN') {
      toast.error('Администраторов нельзя удалить')
      return
    }

    setUserToDelete(userId)
    onDeleteUserOpen()
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    const user = users.find(u => u.id === userToDelete)
    
    // Дополнительная проверка роли
    if (user && user.role === 'ADMIN') {
      toast.error('Администраторов нельзя удалить')
      return
    }

    try {
      const response = await fetch(`/api/admin/users?id=${userToDelete}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось удалить пользователя')
      }

      // Обновление списка пользователей
      setUsers(prev => prev.filter(u => u.id !== userToDelete))
      
      toast.success('Куратор удален')
      
      // Закрытие модального окна
      onDeleteUserOpenChange()
      
      // Сброс состояния
      setUserToDelete(null)
    } catch (error) {
      toast.error('Ошибка удаления куратора', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка'
      })
    }
  }

  const handleResetPassword = async () => {
    if (!currentUser.id || !newPassword) {
      toast.error('Введите новый пароль')
      return
    }

    try {
      const hashedPassword = await hashPassword(newPassword)
      
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: currentUser.id,
          password: hashedPassword
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось сбросить пароль')
      }

      toast.success(`Пароль для ${currentUser.name} успешно изменен`)
      
      // Закрытие модального окна
      onResetPasswordOpenChange()
      
      // Сброс состояний
      setCurrentUser({})
      setNewPassword('')
    } catch (error) {
      toast.error('Ошибка сброса пароля', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка'
      })
    }
  }

  const initiatePasswordReset = (user: User) => {
    setCurrentUser(user)
    setNewPassword(generateRandomPassword())
    onResetPasswordOpen()
  }

  const fetchInitialData = async () => {
    setLoading(true); // Set loading to true when fetching data
    try {
      // Fetch groups first
      const groupsResponse = await fetch('/api/admin/groups')
      const groupsData = await groupsResponse.json()
      
      if (!groupsResponse.ok) {
        throw new Error(`HTTP error! status: ${groupsResponse.status}, message: ${await groupsResponse.text()}`)
      }
      
      setGroups(groupsData.map((group: any) => ({
        key: group.id,
        label: group.name,
        code: group.code,  // Explicitly set the group code
        curators: group.curator ? [group.curator] : [] // Convert single curator to array
      })))

      // Fetch users
      const usersResponse = await fetch('/api/admin/users')
      const usersData = await usersResponse.json()

      if (!usersResponse.ok) {
        throw new Error(usersData.error || 'Не удалось загрузить пользователей')
      }
      
      // Map groups to users
      const usersWithGroups = usersData.map((user: User) => {
        const userGroups = groupsData
          .filter((group: any) => 
            group.curator && group.curator.id === user.id
          )
          .map((group: any) => ({
            id: group.id,
            name: group.name,
            code: group.code || group.name
          }))
        
        return {
          ...user,
          groups: userGroups
        }
      })


      setUsers(usersWithGroups)
    } catch (error) {
      toast.error('Не удалось загрузить данные', {
        description: error instanceof Error ? error.message : 'Проверьте подключение к серверу'
      })
    } finally {
      setLoading(false); // Set loading to false after fetching data
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

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
    <>
      <motion.div 
        className="space-y-6 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="container mx-auto w-full sm:max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-8"
          variants={containerVariants}
        >
          <h1 className="text-xl sm:text-3xl font-bold text-center mb-4 sm:mb-6 text-gray-800 dark:text-white">
            Управление кураторами
          </h1>

          <div className="flex justify-end mb-4">
            <Button 
              color="primary" 
              variant="shadow"
              startContent={<UserPlus />}
              onPress={() => {
                setCurrentUser({})
                setIsEditing(false)
                onUserModalOpen()
              }}
              className="text-white w-full sm:w-auto"
              size="sm"
            >
              Добавить куратора
            </Button>
          </div>

          {loading ? (
            <Skeleton className="h-52 w-full" variant='rounded' width="100%" height="250px" />
          ) : (
            <Table 
              aria-label="Список пользователей"
              color="primary"
              selectionMode="single"
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md w-full"
              classNames={{
                th: "bg-blue-50 dark:bg-gray-700 text-gray-800 dark:text-white text-xs sm:text-sm",
                td: "text-gray-800 dark:text-white text-xs sm:text-sm"
              }}
            >
              <TableHeader>
                <TableColumn>ФИО</TableColumn>
                <TableColumn>Логин</TableColumn>
                <TableColumn>Роль</TableColumn>
                <TableColumn>Группы</TableColumn>
                <TableColumn>Действия</TableColumn>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50">
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.login}</TableCell>
                    <TableCell>
                      <Chip 
                        color={user.role === 'CURATOR' ? 'secondary' : 'primary'}
                        variant="flat"
                        size="sm"
                      >
                        {user.role === 'CURATOR' ? 'Куратор' : 'Администратор'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {user.groups && user.groups.length > 0 
                        ? user.groups.map(group => {
                            return `${group.code || group.name || 'Без кода'}`
                          }).join(', ') 
                        : 'Нет групп'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tooltip content="Сбросить пароль">
                          <Button 
                            isIconOnly 
                            size="sm" 
                            variant="light"
                            color="warning"
                            onPress={() => initiatePasswordReset(user)}
                            className="text-gray-800 dark:text-white hover:text-yellow-600 dark:hover:text-yellow-400"
                          >
                            <RefreshCw size={16} />
                          </Button>
                        </Tooltip>
                        {user.role === 'CURATOR' && (
                          <> 
                            <Button 
                              isIconOnly 
                              size="sm" 
                              variant="light"
                              onPress={() => handleEditUser(user)}
                              className="text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button 
                              isIconOnly 
                              size="sm" 
                              variant="light" 
                              color="danger"
                              onPress={() => confirmDeleteUser(user.id!)}
                              className="text-gray-800 dark:text-white hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
                        {user.role === 'ADMIN' && (
                          <Tooltip content="Администраторов нельзя редактировать или удалять">
                            <div className="text-xs text-gray-400 dark:text-gray-600"></div>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </motion.div>

        <Modal 
          isOpen={isUserModalOpen}
          backdrop='blur'
          onOpenChange={onUserModalOpenChange}
          className="text-gray-800 dark:text-white"
          size="md"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="text-gray-800 dark:text-white text-md sm:text-lg">
                  {isEditing ? 'Редактирование куратора' : 'Добавление куратора'}
                </ModalHeader>
                <ModalBody className="space-y-3">
                  <Input
                    label="ФИО"
                    value={currentUser.name || ''}
                    onValueChange={(value) => setCurrentUser(prev => ({ ...prev, name: value }))}
                    variant="bordered"
                    size="sm"
                  />
                  <Input
                    label="Логин"
                    value={currentUser.login || ''}
                    onValueChange={(value) => setCurrentUser(prev => ({ ...prev, login: value }))}
                    variant="bordered"
                    size="sm"
                  />
                  {!isEditing && (
                    <Input
                      label="Пароль (необязательно)"
                      value={currentUser.password || ''}
                      onValueChange={(value) => setCurrentUser(prev => ({ ...prev, password: value }))}
                      variant="bordered"
                      size="sm"
                      description="Пароль будет сгенерирован автоматически"
                    />
                  )}
                  <Select
                    label="Роль"
                    variant="bordered"
                    size="sm"
                    selectedKeys={currentUser.role ? [currentUser.role.toLowerCase()] : []}
                    onSelectionChange={(keys) => {
                      const selectedRole = Array.from(keys)[0] as 'curator' | 'admin'
                      setCurrentUser(prev => ({ 
                        ...prev, 
                        role: selectedRole === 'curator' ? 'CURATOR' : 'ADMIN'
                      }))
                    }}
                  >
                    <SelectItem key="curator" value="curator">Куратор</SelectItem>
                    <SelectItem key="admin" value="admin">Администратор</SelectItem>
                  </Select>
                  {!isEditing ? null : renderGroupSelection()}
                </ModalBody>
                <ModalFooter>
                  <Button 
                    color="danger" 
                    variant="light" 
                    onPress={onClose}
                    size="sm"
                  >
                    Отмена
                  </Button>
                  <Button 
                    color="primary" 
                    onPress={isEditing ? handleUpdateUser : handleAddUser}
                    size="sm"
                    isDisabled={
                      !currentUser.name || 
                      !currentUser.login || 
                      !currentUser.role
                    }
                    className="text-white"
                  >
                    {isEditing ? 'Обновить' : 'Создать'}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        <Modal 
          isOpen={isDeleteUserOpen}
          backdrop='blur'
          onOpenChange={onDeleteUserOpenChange}
          className="text-gray-800 dark:text-white"
          size="md"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="text-gray-800 dark:text-white text-md sm:text-lg">
                  Удаление куратора
                </ModalHeader>
                <ModalBody>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Вы уверены, что хотите удалить этого куратора? 
                    Это действие нельзя будет отменить.
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button 
                    color="default" 
                    variant="light" 
                    onPress={onClose}
                    size="sm"
                  >
                    Отмена
                  </Button>
                  <Button 
                    color="danger" 
                    onPress={handleDeleteUser}
                    size="sm"
                    className="text-white"
                  >
                    Удалить
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        <Modal 
          isOpen={isResetPasswordOpen}
          backdrop='blur'
          onOpenChange={onResetPasswordOpenChange}
          className="text-gray-800 dark:text-white"
          size="md"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="text-gray-800 dark:text-white text-md sm:text-lg">
                  Сброс пароля для {currentUser.name}
                </ModalHeader>
                <ModalBody className="space-y-3">
                  <Input
                    label="Новый пароль"
                    value={newPassword}
                    onValueChange={setNewPassword}
                    variant="bordered"
                    size="sm"
                    description="Пароль будет сгенерирован автоматически"
                  />
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Пользователь должен будет сменить пароль при первом входе
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button 
                    color="danger" 
                    variant="light" 
                    onPress={onClose}
                    size="sm"
                  >
                    Отмена
                  </Button>
                  <Button 
                    color="primary" 
                    onPress={handleResetPassword}
                    size="sm"
                    className="text-white"
                  >
                    Сбросить пароль
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </motion.div>
    </>
  )
}
