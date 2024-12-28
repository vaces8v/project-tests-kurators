'use client'
import React, { useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  Alert,
  Button,
  Chip,
  Input
} from "@nextui-org/react"
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Check, X, Trash } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAlertsStore } from '@/store/alerts.store'

interface StudentData {
  id?: string
  firstName: string
  lastName: string
  middleName?: string
  isEditing?: boolean
}

interface GroupData {
  id: string
  code: string
  name: string
  curator?: {
    id: string
    name: string
  }
}

export default function StudentManagementPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.groupId as string

  const [group, setGroup] = useState<GroupData | null>(null)
  const [students, setStudents] = useState<StudentData[]>([])
  const [editedRows, setEditedRows] = useState<{[key: string]: boolean}>({})
  const {infoStudents, setInfoStudents} = useAlertsStore()


  React.useEffect(() => {
    const fetchGroupAndStudents = async () => {
      try {
        // Загрузка информации о группе
        const groupResponse = await fetch(`/api/admin/groups/${groupId}`)
        const groupData = await groupResponse.json()
        setGroup(groupData)

        // Загрузка студентов группы
        const studentsResponse = await fetch(`/api/admin/groups/${groupId}/students`)
        const studentsData = await studentsResponse.json()
        
        setStudents(studentsData)
      } catch (error) {
        console.error('Ошибка загрузки данных', error)
        toast.error('Не удалось загрузить данные', {
          description: error instanceof Error ? error.message : 'Проверьте подключение к серверу'
        })
      }
    }

    fetchGroupAndStudents()
  }, [groupId])

  const handleEditRow = (index: number) => {
    const updatedStudents = [...students]
    updatedStudents[index] = {
      ...updatedStudents[index],
      isEditing: true
    }
    setStudents(updatedStudents)
  }

  const handleCancelEdit = (index: number) => {
    const updatedStudents = [...students]
    updatedStudents[index] = {
      ...updatedStudents[index],
      isEditing: false
    }
    setStudents(updatedStudents)
  }

  const handleInputChange = (index: number, field: keyof StudentData, value: string) => {
    const updatedStudents = [...students]
    updatedStudents[index] = {
      ...updatedStudents[index],
      [field]: value
    }
    
    if (updatedStudents[index].id) {
      setEditedRows(prev => ({
        ...prev,
        [updatedStudents[index].id!]: true
      }))
    }

    setStudents(updatedStudents)
  }

  const handleAddNewRow = () => {
    setStudents(prev => [...prev, { 
      id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      firstName: '', 
      lastName: '', 
      middleName: '',
      isEditing: true
    }])
  }

  const handleSaveChanges = async () => {
    const updatedStudentsBeforeSave = students.map(student => {
      if (student.isEditing) {
        return {
          ...student,
          isEditing: false,
          ...(student.id ? { id: student.id } : {})
        }
      }
      return student
    })

    setStudents(updatedStudentsBeforeSave)
    const changedStudents = updatedStudentsBeforeSave.filter(student => 
      !student.id || 
      student.id.startsWith('new-') || 
      editedRows[student.id as string]
    )

    try {
      const newStudents = changedStudents.filter(student => !student.id || student.id.startsWith('new-'))
      const existingStudents = changedStudents.filter(student => student.id && !student.id.startsWith('new-'))

      console.log('New Students:', JSON.stringify(newStudents, null, 2))
      console.log('Existing Students:', JSON.stringify(existingStudents, null, 2))

      // Validate all students before sending
      changedStudents.forEach((student, index) => {
        const trimmedFirstName = student.firstName.trim()
        const trimmedLastName = student.lastName.trim()
        
        if (!trimmedFirstName || !trimmedLastName) {
          throw new Error(`Студент #${index + 1}: Имя и фамилия обязательны для заполнения`)
        }
      })

      const savePromises = []

      if (newStudents.length > 0) {
        const newStudentData = newStudents.map(student => ({
          firstName: student.firstName.trim(),
          lastName: student.lastName.trim(),
          middleName: student.middleName?.trim() || null,
        }))

        const newStudentsResponse = await fetch(`/api/admin/groups/${groupId}/students`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(newStudentData)
        })

        console.log('New Students Response Status:', newStudentsResponse.status)

        if (!newStudentsResponse.ok) {
          const errorData = await newStudentsResponse.text()
          console.error('Create new students error:', errorData)
          throw new Error(`Не удалось создать новых студентов: ${errorData}`)
        }

        const newStudentsResult = await newStudentsResponse.json()
        console.log('New Students Result:', JSON.stringify(newStudentsResult, null, 2))
        savePromises.push(Promise.resolve(newStudentsResult))
      }

      const updatePromises = existingStudents.map(async (student) => {
        const studentData = {
          firstName: student.firstName.trim(),
          lastName: student.lastName.trim(),
          middleName: student.middleName?.trim() || null,
        }

        console.log(`Updating student ${student.id}:`, JSON.stringify(studentData, null, 2))

        const response = await fetch(`/api/admin/groups/${groupId}/students/${student.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(studentData)
        })

        console.log(`Update Response Status for student ${student.id}:`, response.status)

        if (!response.ok) {
          const errorData = await response.text()
          console.error(`Update error for student ${student.id}:`, errorData)
          throw new Error(`Не удалось обновить студента ${student.id}: ${errorData}`)
        }

        return response.json()
      })

      const savedStudents = await Promise.all([
        ...savePromises, 
        ...updatePromises
      ])
      
      console.log('Saved Students:', JSON.stringify(savedStudents, null, 2))

      toast.success('Изменения сохранены')
      setEditedRows({})
      
      setStudents(prev => {
        const savedStudentsMap = new Map(
          savedStudents.map(saved => [saved.id, saved])
        )

        const updatedStudents = prev.map(student => {
          if (student.id && savedStudentsMap.has(student.id)) {
            const savedStudent = savedStudentsMap.get(student.id)!
            return {
              ...savedStudent,
              isEditing: false
            }
          }
          
          const matchedNewStudent = savedStudents.find(
            saved => !saved.id && 
            saved.firstName === student.firstName && 
            saved.lastName === student.lastName
          )
          
          if (matchedNewStudent) {
            return {
              ...matchedNewStudent,
              isEditing: false
            }
          }

          return {
            ...student,
            isEditing: false
          }
        })

        console.log('Updated Students:', JSON.stringify(updatedStudents, null, 2))
        return updatedStudents
      })
    } catch (error) {
      console.error('Ошибка сохранения студентов:', error)
      
      if (error instanceof Error) {
        toast.error('Ошибка сохранения студентов', {
          description: error.message
        })
      } else {
        toast.error('Неизвестная ошибка')
      }

      setStudents(prev => prev.map(student => ({
        ...student,
        isEditing: true
      })))
    }
  }

  const handlePasteFromExcel = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const clipboardData = e.clipboardData
    const pastedText = clipboardData.getData('text/plain')
    
    // Split the pasted text into rows and columns
    const rows = pastedText.split('\n').filter(row => row.trim() !== '')
    const parsedStudents: StudentData[] = rows.map((row, rowIndex) => {
      const columns = row.split('\t')
      return {
        // Use a more unique key generation method
        id: `new-${Date.now()}-${rowIndex}-${Math.random().toString(36).substr(2, 9)}`,
        lastName: columns[0]?.trim() || '',
        firstName: columns[1]?.trim() || '',
        middleName: columns[2]?.trim() || '',
        isEditing: true
      }
    })

    setStudents(prev => {
      // Find indices of currently editing rows
      const editingIndices = prev
        .map((student, index) => student.isEditing ? index : -1)
        .filter(index => index !== -1)

      // If there are editing rows
      if (editingIndices.length > 0) {
        // Create a copy of the current students array
        const updatedStudents = [...prev]

        // Replace editing rows with pasted data
        editingIndices.forEach((editIndex, pasteIndex) => {
          if (pasteIndex < parsedStudents.length) {
            updatedStudents[editIndex] = {
              ...parsedStudents[pasteIndex],
              id: updatedStudents[editIndex].id // Preserve original ID if it exists
            }
          }
        })

        // If more pasted rows than editing rows, append them
        if (parsedStudents.length > editingIndices.length) {
          const additionalRows = parsedStudents.slice(editingIndices.length)
          updatedStudents.push(...additionalRows)
        }

        return updatedStudents
      }

      // If no editing rows, simply add all pasted rows
      return [...prev, ...parsedStudents]
    })

    toast.success(`Вставлено ${parsedStudents.length} строк из Excel`)
  }, [])

  const handleDeleteRow = async (index: number) => {
    const studentToDelete = students[index]

    // Check if it's a new, unsaved row with no values
    const isEmptyNewRow = 
      (!studentToDelete.id || studentToDelete.id.startsWith('new-')) &&
      !studentToDelete.firstName.trim() &&
      !studentToDelete.lastName.trim() &&
      !studentToDelete.middleName?.trim()

    // If it's an empty new row, just remove it from the state
    if (isEmptyNewRow) {
      setStudents(prev => prev.filter((_, i) => i !== index))
      return
    }

    // If the student has an ID, it means it's an existing student in the database
    if (studentToDelete.id && !studentToDelete.id.startsWith('new-')) {
      try {
        const response = await fetch(`/api/admin/groups/${groupId}/students/${studentToDelete.id}`, {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Не удалось удалить студента')
        }

        toast.success('Студент удален')
      } catch (error) {
        console.error('Ошибка удаления студента:', error)
        toast.error('Не удалось удалить студента', {
          description: error instanceof Error ? error.message : 'Неизвестная ошибка'
        })
        return
      }
    }

    // Remove the student from the local state
    setStudents(prev => prev.filter((_, i) => i !== index))
  }

  const variants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };


  return (
   <>
    <div 
      className="container mx-auto p-6 bg-transparent min-h-screen"
      onPaste={handlePasteFromExcel}
    >
      <AnimatePresence>
        {infoStudents && (
          <motion.div
            key="alert"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            transition={{ duration: 0.5 }}
          >
            <Alert onClose={() => setInfoStudents(false)} className='container p-6 max-w-4xl mx-auto' style={{maxWidth: '56rem', margin: '0 auto'}} isClosable color='secondary' variant="flat" title='Обратите внимание на возможные ограничения в функционале.' description='В системе есть доработки, касающиеся управления студентами. Некоторые функции все еще в разработке и могут привести к дефектам.'/>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{marginTop: infoStudents ? '10px' : '0'}} className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center mb-6">
          <Button 
            isIconOnly 
            variant="light" 
            className="mr-4" 
            onPress={() => router.push('/a/group')}
          >
            <ArrowLeft />
          </Button>
          {group && (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Группа {group.code}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-lg text-gray-600 dark:text-gray-300">{group.name}</p>
                {group.curator && (
                  <Chip color="secondary" variant="flat" size="sm">
                    Куратор: {group.curator.name}
                  </Chip>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mb-4 space-x-4">
          <Button 
            color="primary" 
            variant="shadow"
            onPress={handleAddNewRow}
            className="text-white"
          >
            Добавить строку
          </Button>
          <Button 
            color="success" 
            variant="shadow"
            onPress={handleSaveChanges}
            className="text-white"
          >
            Сохранить изменения
          </Button>
        </div>

        <div className="overflow-x-auto rounded-2xl shadow-md" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <table className="w-full border-collapse rounded-2xl overflow-hidden">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left first:rounded-tl-xl last:rounded-tr-xl">Фамилия</th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Имя</th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Отчество</th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left last:rounded-tr-xl">Действия</th>
              </tr>
            </thead>
            <tbody className="rounded-2xl overflow-hidden">
              {students.map((student, index) => (
                <tr 
                  key={student.id || `student-${index}`} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    index === students.length - 1 ? 'last:rounded-bl-2xl last:rounded-br-2xl' : ''
                  }`}
                >
                  {student.isEditing ? (
                    <>
                      <td className="border border-gray-300 dark:border-gray-600 p-2">
                        <Input
                          value={student.lastName}
                          onChange={(e) => handleInputChange(index, 'lastName', e.target.value)}
                          placeholder="Фамилия"
                          variant="bordered"
                          size="sm"
                          classNames={{
                            inputWrapper: "border-gray-300 dark:border-gray-600"
                          }}
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-2">
                        <Input
                          value={student.firstName}
                          onChange={(e) => handleInputChange(index, 'firstName', e.target.value)}
                          placeholder="Имя"
                          variant="bordered"
                          size="sm"
                          classNames={{
                            inputWrapper: "border-gray-300 dark:border-gray-600"
                          }}
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-2">
                        <Input
                          value={student.middleName || ''}
                          onChange={(e) => handleInputChange(index, 'middleName', e.target.value)}
                          placeholder="Отчество"
                          variant="bordered"
                          size="sm"
                          classNames={{
                            inputWrapper: "border-gray-300 dark:border-gray-600"
                          }}
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-2 flex space-x-2">
                        <Button 
                          isIconOnly 
                          color="success" 
                          variant="light" 
                          onPress={() => handleSaveChanges()}
                        >
                          <Check className="w-5 h-5" />
                        </Button>
                        <Button 
                          isIconOnly 
                          color="danger" 
                          variant="light" 
                          onPress={() => handleCancelEdit(index)}
                        >
                          <X className="w-5 h-5" />
                        </Button>
                        <Button 
                          isIconOnly 
                          color="danger" 
                          variant="light" 
                          onPress={() => handleDeleteRow(index)}
                        >
                          <Trash className="w-5 h-5" />
                        </Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border border-gray-300 dark:border-gray-600 p-2">{student.lastName}</td>
                      <td className="border border-gray-300 dark:border-gray-600 p-2">{student.firstName}</td>
                      <td className="border border-gray-300 dark:border-gray-600 p-2">{student.middleName}</td>
                      <td className="border border-gray-300 dark:border-gray-600 p-2 flex space-x-2">
                        <Button 
                          isIconOnly 
                          color="primary" 
                          variant="light" 
                          onPress={() => handleEditRow(index)}
                        >
                          <Pencil className="w-5 h-5" />
                        </Button>
                        <Button 
                          isIconOnly 
                          color="danger" 
                          variant="light" 
                          onPress={() => handleDeleteRow(index)}
                        >
                          <Trash className="w-5 h-5" />
                        </Button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
   </>
  )
}
