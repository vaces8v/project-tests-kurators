'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { 
  Edit, 
  Trash2, 
  Plus, 
  UserPlus 
} from 'lucide-react'
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
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tooltip,
  Chip
} from "@nextui-org/react"
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface GroupData {
  id?: string
  code: string
  name: string
  curatorId?: string
  curators?: { id: string, name: string }[]
  curator?: { id: string, name: string, email: string }
}

interface CuratorData {
  id: string
  name: string
  role: 'curator'
  email: string
}

export default function GroupPage() {
  const [groups, setGroups] = useState<GroupData[]>([])
  const [curators, setCurators] = useState<CuratorData[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Partial<GroupData>>({})
  const [isEditing, setIsEditing] = useState(false)

  const { 
    isOpen: isGroupModalOpen, 
    onOpen: onGroupModalOpen, 
    onOpenChange: onGroupModalOpenChange 
  } = useDisclosure()

  const { 
    isOpen: isDeleteModalOpen, 
    onOpen: onDeleteModalOpen, 
    onOpenChange: onDeleteModalOpenChange 
  } = useDisclosure()

  const router = useRouter()

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Загрузка групп
        const groupsResponse = await fetch('/api/admin/groups')
        
        if (!groupsResponse.ok) {
          const errorText = await groupsResponse.text()
          console.error('Groups fetch error:', errorText)
          throw new Error(`HTTP error! status: ${groupsResponse.status}, message: ${errorText}`)
        }
        
        const groupsData = await groupsResponse.json()
        
        // Validate that groupsData is an array
        if (!Array.isArray(groupsData)) {
          throw new Error('Groups data is not an array')
        }
        
        setGroups(groupsData)

        // Загрузка кураторов
        const curatorsResponse = await fetch('/api/admin/users?role=curator')
        const curatorsData = await curatorsResponse.json()
        setCurators(curatorsData)
      } catch (error) {
        console.error('Data fetch error:', error)
        toast.error('Не удалось загрузить данные', {
          description: error instanceof Error ? error.message : 'Проверьте подключение к серверу'
        })
      }
    }

    fetchInitialData()
  }, [])

  const handleCreateGroup = async () => {
    if (!selectedGroup.code || !selectedGroup.name) {
      toast.error('Заполните код и название группы')
      return
    }

    // Найдем полную информацию о выбранном кураторе
    const selectedCurator = curators.find(c => c.id === selectedGroup.curatorId)

    try {
      const response = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          code: selectedGroup.code,
          name: selectedGroup.name,
          curatorId: selectedGroup.curatorId,
          curator: selectedCurator ? {
            id: selectedCurator.id,
            name: selectedCurator.name,
            email: selectedCurator.email,
            role: selectedCurator.role
          } : null
        })
      })


      let responseText = '';
      let newGroup = null;

      try {
        responseText = await response.text()
        
        // Only parse if there's content
        if (responseText.trim()) {
          newGroup = JSON.parse(responseText)
        }
      } catch (parseError) {
        console.error('Response parsing error:', parseError)
      }

      if (!response.ok) {
        throw new Error(
          newGroup?.error || 
          newGroup?.details || 
          responseText || 
          'Не удалось создать группу'
        )
      }

      // Fallback if parsing failed but response was successful
      if (!newGroup) {
        toast.warning('Группа создана, но данные не могут быть отображены')
        return
      }

      setGroups(prev => [...prev, {
        ...newGroup,
        curator: selectedCurator ? {
          id: selectedCurator.id,
          name: selectedCurator.name,
          email: selectedCurator.email
        } : undefined,
        curators: selectedCurator 
          ? [{ id: selectedCurator.id, name: selectedCurator.name }] 
          : [],
        curatorId: selectedCurator?.id
      }])
      
      toast.success(`Группа ${newGroup.name} создана`)
      
      // Сброс состояния
      setSelectedGroup({})
      onGroupModalOpenChange()
    } catch (error) {
      console.error('Group creation error:', error)
      toast.error('Ошибка создания группы', {
        description: error instanceof Error 
          ? error.message 
          : 'Неизвестная ошибка'
      })
    }
  }

  const handleUpdateGroup = async () => {
    if (!selectedGroup.id || !selectedGroup.code || !selectedGroup.name) {
      toast.error('Заполните все обязательные поля')
      return
    }

    // Найдем полную информацию о выбранном кураторе
    const selectedCurator = curators.find(c => c.id === selectedGroup.curatorId)

    try {
      const updatePayload = {
        id: selectedGroup.id,
        code: selectedGroup.code,
        name: selectedGroup.name,
        curatorId: selectedGroup.curatorId || null,  
        curator: selectedCurator ? {
          id: selectedCurator.id,
          name: selectedCurator.name,
          email: selectedCurator.email,
          role: selectedCurator.role
        } : null
      }


      const response = await fetch(`/api/admin/groups/${selectedGroup.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      })

      // Check for non-200 status before attempting to parse
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Update error response:', errorText)
        throw new Error(errorText || 'Не удалось обновить группу')
      }

      const updatedGroup = await response.json()

      // Обновляем список групп с новой информацией
      setGroups(prev => 
        prev.map(group => group.id === updatedGroup.id ? {
          ...group,
          ...updatedGroup,
          curator: updatedGroup.curator ? {
            id: updatedGroup.curator.id,
            name: updatedGroup.curator.name,
            email: selectedCurator?.email
          } : null,
          curatorId: updatedGroup.curator?.id,
          curators: updatedGroup.curator ? 
            [{ id: updatedGroup.curator.id, name: updatedGroup.curator.name }] 
            : []
        } : group)
      )

      // Показываем уведомление о статусе обновления куратора
      if (updatedGroup.curator) {
        toast.success(`Группа ${updatedGroup.name} обновлена`, {
          description: `Куратор обновлен: ${updatedGroup.curator.name}`
        })
      } else if (updatedGroup.curatorChanged) {
        toast.success(`Группа ${updatedGroup.name} обновлена`, {
          description: 'Куратор группы был удален'
        })
      } else {
        toast.success(`Группа ${updatedGroup.name} обновлена`)
      }
      
      // Сброс состояния
      setSelectedGroup({})
      onGroupModalOpenChange()
    } catch (error) {
      console.error('Group update error:', error)
      toast.error('Ошибка обновления группы', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка'
      })
    }
  }

  const handleDeleteGroup = async () => {
    if (!selectedGroup.id) {
      toast.error('Группа не выбрана')
      return
    }

    try {
      const response = await fetch(`/api/admin/groups/${selectedGroup.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Не удалось удалить группу')
      }

      const result = await response.json()

      // Remove the group from the state
      setGroups(prev => prev.filter(group => group.id !== selectedGroup.id))
      
      // Provide detailed success message
      if (result.curatorDisconnected) {
        toast.success('Группа удалена', {
          description: 'Группа была отвязана от куратора'
        })
      } else {
        toast.success('Группа удалена')
      }
      
      // Сброс состояния
      setSelectedGroup({})
      onDeleteModalOpenChange()
    } catch (error) {
      console.error('Group deletion error:', error)
      toast.error('Ошибка удаления группы', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка'
      })
    }
  }

  const initiateGroupEdit = (group: GroupData) => {
    ({
      groupId: group.id,
      groupCode: group.code,
      currentCurator: group.curator,
      currentCuratorId: group.curator?.id || group.curatorId,
      availableCurators: curators
    })

    // Determine the curator to use
    const groupCurator = 
      group.curator || 
      (group.curatorId 
        ? curators.find(c => c.id === group.curatorId) 
        : undefined)

    setSelectedGroup({
      ...group,
      // Preserve the full curator information
      curator: groupCurator,
      curatorId: groupCurator?.id
    })
    
    setIsEditing(true)
    onGroupModalOpen()
  }

  const initiateGroupDelete = (group: GroupData) => {
    setSelectedGroup(group)
    onDeleteModalOpen()
  }

  const resetGroupModal = () => {
    setSelectedGroup({})
    setIsEditing(false)
  }

  return (
    <motion.div 
      className="mx-auto p-6 max-w-full relative bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen"
    >
      <div className="w-[95%] sm:w-full md:max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Управление группами
          </h1>
          <Button 
            color="primary" 
            variant="shadow"
            startContent={<Plus />}
            onPress={() => {
              resetGroupModal()
              onGroupModalOpen()
            }}
            className="text-white"
          >
            Создать группу
          </Button>
        </div>

        <Table 
          aria-label="Список групп"
          color="primary"
          selectionMode="single"
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md w-full"
          classNames={{
            th: "bg-blue-50 dark:bg-gray-700 text-gray-800 dark:text-white",
            td: "text-gray-800 dark:text-white"
          }}
        >
          <TableHeader>
            <TableColumn>Код группы</TableColumn>
            <TableColumn>Название группы</TableColumn>
            <TableColumn>Куратор</TableColumn>
            <TableColumn>Действия</TableColumn>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-16 w-16 text-gray-300 dark:text-gray-600" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1} 
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
                      />
                    </svg>
                    <p className="text-lg font-semibold">
                      Пока что групп не существует
                    </p>
                    <p className="text-sm text-gray-400">
                      Создайте первую группу, нажав кнопку "Создать группу"
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden">{''}</TableCell>
                <TableCell className="hidden">{''}</TableCell>
                <TableCell className="hidden">{''}</TableCell>
              </TableRow>
            ) : (
              groups.map((group) => {
                // Prefer curators from the group, fallback to finding by curatorId
                const curator = 
                  group.curator || 
                  (group.curatorId 
                    ? curators.find(c => c.id === group.curatorId) 
                    : undefined)

                
                return (
                  <TableRow key={group.id}>
                    <TableCell>{group.code}</TableCell>
                    <TableCell>{group.name}</TableCell>
                    <TableCell>
                      {curator ? (
                        <Chip 
                          color="secondary" 
                          variant="flat" 
                          size="sm"
                        >
                          <span>{curator.name}</span>
                        </Chip>
                      ) : (
                        <Chip 
                          color="warning" 
                          variant="flat" 
                          size="sm"
                        >
                          <span>Не назначен</span>
                        </Chip>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tooltip content="Редактировать группу">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => initiateGroupEdit(group)}
                            className="text-gray-800 dark:text-white hover:text-blue-600"
                          >
                            <Edit size={16} />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Управление студентами">
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() => router.push(`/a/students/${group.id}`)}
                            className="text-gray-800 dark:text-white hover:text-blue-600"
                          >
                            Студенты
                          </Button>
                        </Tooltip>
                        <Tooltip content="Удалить группу">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => initiateGroupDelete(group)}
                            className="text-gray-800 dark:text-white hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Модальное окно создания/редактирования группы */}
        <Modal 
          isOpen={isGroupModalOpen}
          backdrop='blur'
          onOpenChange={onGroupModalOpenChange}
          onClose={resetGroupModal}
          className="text-gray-800 dark:text-white"
          size="md"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  {isEditing ? 'Редактирование группы' : 'Создание группы'}
                </ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="Код группы"
                    value={selectedGroup.code || ''}
                    onValueChange={(value) => setSelectedGroup(prev => ({ ...prev, code: value }))}
                    variant="bordered"
                    placeholder="Например, 307ИС"
                  />
                  <Input
                    label="Название группы"
                    value={selectedGroup.name || ''}
                    onValueChange={(value) => setSelectedGroup(prev => ({ ...prev, name: value }))}
                    variant="bordered"
                    placeholder="Например, Информационные системы"
                  />
                  <Select
                    label="Куратор группы"
                    variant="bordered"
                    placeholder="Выберите куратора"
                    selectedKeys={
                      selectedGroup.curator?.id || selectedGroup.curatorId 
                        ? new Set([selectedGroup.curator?.id || selectedGroup.curatorId].filter(Boolean) as string[]) 
                        : new Set()
                    }
                    onSelectionChange={(keys) => {
                      const selectedCuratorId = Array.from(keys)[0] as string
                      setSelectedGroup(prev => ({ 
                        ...prev, 
                        curatorId: selectedCuratorId,
                        curator: curators.find(c => c.id === selectedCuratorId)
                      }))
                    }}
                  >
                    {curators.map((curator) => (
                      <SelectItem key={curator.id} value={curator.id}>
                        {curator.name}
                      </SelectItem>
                    ))}
                  </Select>
                </ModalBody>
                <ModalFooter>
                  <Button 
                    variant="light" 
                    onPress={onClose}
                  >
                    Отмена
                  </Button>
                  <Button 
                    color="primary" 
                    onPress={isEditing ? handleUpdateGroup : handleCreateGroup}
                    isDisabled={!selectedGroup.code || !selectedGroup.name}
                    className="text-white"
                  >
                    {isEditing ? 'Обновить' : 'Создать'}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Модальное окно подтверждения удаления */}
        <Modal 
          isOpen={isDeleteModalOpen}
          backdrop='blur'
          onOpenChange={onDeleteModalOpenChange}
          className="text-gray-800 dark:text-white"
          size="md"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Удаление группы</ModalHeader>
                <ModalBody>
                  <p>
                    Вы уверены, что хотите удалить группу "{selectedGroup.name}"? 
                    Это действие нельзя будет отменить.
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button 
                    variant="light" 
                    onPress={onClose}
                  >
                    Отмена
                  </Button>
                  <Button 
                    color="danger" 
                    onPress={handleDeleteGroup}
                    className="text-white"
                  >
                    Удалить
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </motion.div>
  )
}