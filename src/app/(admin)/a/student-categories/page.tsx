'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Edit } from 'lucide-react'
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
import { toast } from "sonner"

interface Test {
  id: string
  title: string
}

interface StudentCategory {
  id: string
  name: string
  minScore: number
  maxScore: number
  description?: string
  tests?: Test[]
}

export default function StudentCategoriesManagement() {
  const [categories, setCategories] = useState<StudentCategory[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set([]))
  const [isEditing, setIsEditing] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState<Omit<StudentCategory, 'id'>>({
    name: '',
    minScore: 0,
    maxScore: 100,
    description: ''
  })

  const { 
    isOpen: isCategoryModalOpen, 
    onOpen: onCategoryModalOpen, 
    onOpenChange: onCategoryModalOpenChange 
  } = useDisclosure()

  const { 
    isOpen: isDeleteConfirmationOpen, 
    onOpen: onDeleteConfirmationOpen, 
    onOpenChange: onDeleteConfirmationOpenChange 
  } = useDisclosure()

  const [categoryToDelete, setCategoryToDelete] = useState<StudentCategory | null>(null)

  useEffect(() => {
    fetchCategories()
    fetchTests()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/student-categories?include=tests')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      toast.error('Failed to fetch categories', {
        description: error instanceof Error ? error.message : String(error)
      })
    }
  }

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/admin/tests')
      if (!response.ok) {
        throw new Error('Failed to fetch tests')
      }
      const data = await response.json()
      setTests(data)
    } catch (error) {
      toast.error('Failed to fetch tests', {
        description: error instanceof Error ? error.message : String(error)
      })
    }
  }

  const createCategory = async () => {
    try {
      if (!validateCategory()) return

      const response = await fetch('/api/admin/student-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newCategory,
          testIds: Array.from(selectedTests)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create category')
      }

      await fetchCategories() // Refresh the list to get updated data
      resetForm()
      onCategoryModalOpenChange()
      toast.success('Category created successfully')
    } catch (error) {
      toast.error('Failed to create category', {
        description: error instanceof Error ? error.message : String(error)
      })
    }
  }

  const updateCategory = async () => {
    try {
      if (!validateCategory() || !editingCategoryId) return

      const response = await fetch(`/api/admin/student-categories/${editingCategoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingCategoryId,
          ...newCategory,
          testIds: Array.from(selectedTests)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update category')
      }

      await fetchCategories() // Refresh the list to get updated data
      resetForm()
      onCategoryModalOpenChange()
      toast.success('Category updated successfully')
    } catch (error) {
      toast.error('Failed to update category', {
        description: error instanceof Error ? error.message : String(error)
      })
    }
  }

  const deleteCategory = async () => {
    if (!categoryToDelete) return

    try {
      const response = await fetch(`/api/admin/student-categories/${categoryToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete category')
      }

      setCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id))
      setCategoryToDelete(null)
      onDeleteConfirmationOpenChange()
      toast.success('Category deleted successfully')
    } catch (error) {
      toast.error('Failed to delete category', {
        description: error instanceof Error ? error.message : String(error)
      })
    }
  }

  const validateCategory = () => {
    if (!newCategory.name.trim()) {
      toast.error('Название категории обязательно')
      return false
    }

    if (newCategory.minScore >= newCategory.maxScore) {
      toast.error('Минимальный балл должен быть меньше максимального')
      return false
    }

    // Проверяем пересечение диапазонов с существующими категориями
    const hasOverlap = categories.some(category => {
      // Пропускаем текущую категорию при редактировании
      if (category.id === editingCategoryId) {
        return false
      }

      // Проверяем пересечение диапазонов
      const overlapsMin = newCategory.minScore >= category.minScore && newCategory.minScore <= category.maxScore
      const overlapsMax = newCategory.maxScore >= category.minScore && newCategory.maxScore <= category.maxScore
      const encompasses = newCategory.minScore <= category.minScore && newCategory.maxScore >= category.maxScore

      return overlapsMin || overlapsMax || encompasses
    })

    if (hasOverlap) {
      toast.error('Диапазон баллов пересекается с существующей категорией')
      return false
    }

    // Проверяем, что баллы не отрицательные
    if (newCategory.minScore < 0 || newCategory.maxScore < 0) {
      toast.error('Баллы не могут быть отрицательными')
      return false
    }

    return true
  }

  const editCategory = async (category: StudentCategory) => {
    try {
      // Fetch category with tests
      const response = await fetch(`/api/admin/student-categories/${category.id}?include=tests`)
      if (!response.ok) {
        throw new Error('Failed to fetch category details')
      }
      const categoryWithTests = await response.json()
      
      setNewCategory({
        name: category.name,
        minScore: category.minScore,
        maxScore: category.maxScore,
        description: category.description || ''
      })
      
      // Set selected tests from the fetched category
      if (categoryWithTests.tests && categoryWithTests.tests.length > 0) {
        const testIds = new Set<string>(categoryWithTests.tests.map((test: Test) => test.id))
        setSelectedTests(testIds)
      } else {
        setSelectedTests(new Set<string>())
      }
      
      setIsEditing(true)
      setEditingCategoryId(category.id)
      onCategoryModalOpen()
    } catch (error) {
      toast.error('Failed to load category details', {
        description: error instanceof Error ? error.message : String(error)
      })
    }
  }

  const confirmDeleteCategory = (category: StudentCategory) => {
    setCategoryToDelete(category)
    onDeleteConfirmationOpen()
  }

  const resetForm = () => {
    setNewCategory({
      name: '',
      minScore: 0,
      maxScore: 100,
      description: ''
    })
    setSelectedTests(new Set<string>())
    setIsEditing(false)
    setEditingCategoryId(null)
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
      className="space-y-6 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white w-full text-center sm:text-left">
          Категории студентов
        </h1>
        <Button 
          color="primary" 
          onPress={() => {
            resetForm()
            onCategoryModalOpen()
          }}
          className="bg-blue-500 text-white hover:bg-blue-600 w-full sm:w-auto"
          startContent={<Plus size={16} className="min-w-[16px]" />}
          size="sm"
        >
          Создать категорию
        </Button>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
        <Table 
          aria-label="Categories table"
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md w-full"
          classNames={{
            th: "bg-blue-50 dark:bg-gray-700 text-gray-700 dark:text-white text-xs sm:text-sm",
            td: "text-gray-700 dark:text-white text-xs sm:text-sm"
          }}
        >
          <TableHeader>
            <TableColumn className="text-gray-800 dark:text-white">Название</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white">Мин. балл</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white">Макс. балл</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white hidden sm:table-cell">Описание</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white hidden sm:table-cell">Тесты</TableColumn>
            <TableColumn className="text-gray-800 dark:text-white">Действия</TableColumn>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell className="hidden sm:table-cell">-</TableCell>
                <TableCell className="hidden sm:table-cell">-</TableCell>
                <TableCell className="text-center text-gray-800 dark:text-white">
                  Категории не найдены
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50">
                  <TableCell>
                    <span className="font-semibold">{category.name}</span>
                  </TableCell>
                  <TableCell>{category.minScore}</TableCell>
                  <TableCell>{category.maxScore}</TableCell>
                  <TableCell className="hidden sm:table-cell">{category.description || '-'}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {category.tests && category.tests.length > 0 
                      ? (
                        <div className="flex flex-wrap gap-1">
                          {category.tests.map(test => (
                            <span key={test.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {test.title}
                            </span>
                          ))}
                        </div>
                      )
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light"
                        className="text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        onPress={() => editCategory(category)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light" 
                        color="danger"
                        className="text-gray-800 dark:text-white hover:text-red-600 dark:hover:text-red-400"
                        onPress={() => confirmDeleteCategory(category)}
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

      {/* Category Modal */}
      <Modal 
        isOpen={isCategoryModalOpen}
        backdrop='blur'
        onOpenChange={onCategoryModalOpenChange}
        className="text-gray-800 dark:text-white"
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-gray-800 dark:text-white text-md sm:text-lg">
                {isEditing ? 'Редактирование категории' : 'Создание категории'}
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label="Название категории"
                  variant="bordered"
                  size="sm"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({...prev, name: e.target.value}))}
                  className="text-gray-800 dark:text-white"
                  classNames={{
                    label: "text-gray-600 dark:text-gray-300 text-xs sm:text-sm",
                    input: "text-gray-800 dark:text-white text-xs sm:text-sm"
                  }}
                />
                <Select
                  label="Выберите тест"
                  placeholder="Выберите тест"
                  variant="bordered"
                  size="sm"
                  selectionMode="multiple"
                  selectedKeys={selectedTests}
                  onSelectionChange={(keys) => {
                    if (typeof keys === "string") {
                      setSelectedTests(new Set([keys]));
                    } else {
                      setSelectedTests(new Set([...keys].map(key => String(key))));
                    }
                  }}
                  className="text-gray-800 dark:text-white"
                  classNames={{
                    label: "text-gray-600 dark:text-gray-300 text-xs sm:text-sm",
                    trigger: "text-gray-800 dark:text-white text-xs sm:text-sm",
                    value: "text-gray-800 dark:text-white text-xs sm:text-sm"
                  }}
                >
                  {tests.map((test) => (
                    <SelectItem key={test.id} value={test.id}>
                      {test.title}
                    </SelectItem>
                  ))}
                </Select>
                <div className="flex flex-col gap-4">
                  <Input
                    label="Минимальный балл"
                    type="number"
                    variant="bordered"
                    size="sm"
                    value={newCategory.minScore.toString()}
                    onChange={(e) => setNewCategory(prev => ({
                      ...prev, 
                      minScore: parseFloat(e.target.value) || 0
                    }))}
                    className="text-gray-800 dark:text-white"
                    classNames={{
                      label: "text-gray-600 dark:text-gray-300 text-xs sm:text-sm",
                      input: "text-gray-800 dark:text-white text-xs sm:text-sm"
                    }}
                  />
                  <Input
                    label="Максимальный балл"
                    type="number"
                    variant="bordered"
                    size="sm"
                    value={newCategory.maxScore.toString()}
                    onChange={(e) => setNewCategory(prev => ({
                      ...prev, 
                      maxScore: parseFloat(e.target.value) || 0
                    }))}
                    className="text-gray-800 dark:text-white"
                    classNames={{
                      label: "text-gray-600 dark:text-gray-300 text-xs sm:text-sm",
                      input: "text-gray-800 dark:text-white text-xs sm:text-sm"
                    }}
                  />
                </div>
                <Textarea
                  label="Описание"
                  variant="bordered"
                  size="sm"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({...prev, description: e.target.value}))}
                  className="text-gray-800 dark:text-white"
                  classNames={{
                    label: "text-gray-600 dark:text-gray-300 text-xs sm:text-sm",
                    input: "text-gray-800 dark:text-white text-xs sm:text-sm"
                  }}
                />
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="danger" 
                  variant="light" 
                  onPress={() => {
                    resetForm()
                    onClose()
                  }}
                  size="sm"
                >
                  Отмена
                </Button>
                <Button 
                  color="primary" 
                  onPress={isEditing ? updateCategory : createCategory}
                  size="sm"
                >
                  {isEditing ? 'Сохранить изменения' : 'Создать категорию'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteConfirmationOpen} 
        onOpenChange={onDeleteConfirmationOpenChange}
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Подтверждение удаления</ModalHeader>
              <ModalBody>
                <p>Вы уверены, что хотите удалить категорию "{categoryToDelete?.name}"?</p>
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="default" 
                  variant="light" 
                  onPress={onClose}
                >
                  Отмена
                </Button>
                <Button 
                  color="danger" 
                  onPress={deleteCategory}
                >
                  Удалить
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </motion.div>
  )
}
