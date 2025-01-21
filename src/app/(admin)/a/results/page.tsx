'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { FileText, Filter, Search } from 'lucide-react'
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Chip,
  Button,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Checkbox,
  Select,
  SelectItem
} from "@nextui-org/react"

interface TestResult {
  id: string
  studentName: string
  group: string
  testName: string
  completedAt: string
  averageStressScore: number
  categories: string[]
  maxScore?: number
}

export default function ResultsPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    groups: [] as string[],
    testNames: [] as string[],
    categories: [] as string[]
  })

  const [filterOptions, setFilterOptions] = useState({
    groups: [] as string[],
    testNames: [] as string[],
    categories: [] as string[]
  })

  // Fetch results from API
  useEffect(() => {
    async function fetchResults() {
      try {
        const response = await fetch('/api/admin/test-results')
        if (!response.ok) {
          throw new Error('Failed to fetch test results')
        }
        const { results, metadata } = await response.json()
        setResults(results)
        
        // Update filter options based on metadata
        setFilters(prev => ({
          groups: [],
          testNames: [],
          categories: []
        }))

        // Set filter options from metadata
        setFilterOptions({
          groups: metadata.groups,
          testNames: metadata.testNames,
          categories: metadata.categories
        })

        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching results:', error)
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [])

  // Derive unique filter options
  const filterOptionsDisplay = useMemo(() => {
    return filterOptions
  }, [filterOptions])

  // Filter and search logic
  const filteredResults = useMemo(() => {
    return results.filter(result => {
      // Search query filter
      const matchesSearch = searchQuery ? 
        Object.values(result).some(value => 
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        ) : true

      // Group filter
      const matchesGroups = filters.groups.length === 0 || 
        filters.groups.includes(result.group)

      // Test name filter  
      const matchesTestNames = filters.testNames.length === 0 || 
        filters.testNames.includes(result.testName)

      // Categories filter
      const matchesCategories = filters.categories.length === 0 || 
        result.categories.some(category => 
          filters.categories.includes(category)
        )

      return matchesSearch && matchesGroups && matchesTestNames && matchesCategories
    })
  }, [results, searchQuery, filters])

  const getStressLevelColor = (score: number) => {
    if (score <= 3) return 'success'
    if (score <= 6) return 'warning'
    return 'danger'
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

  // Filter Popover Component
  const FilterPopover = () => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <Popover 
        placement="bottom-end" 
        triggerScaleOnOpen={false}
        shouldBlockScroll={true}
        isOpen={isOpen}
        onOpenChange={(open) => setIsOpen(open)}
      >
        <PopoverTrigger>
          <Button 
            variant="solid" 
            color="primary" 
            size="sm"
            startContent={<Filter size={16} />}
          >
            Фильтр
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="p-4 w-[300px]"
          onClick={(e) => {
            // Prevent closing when clicking inside the popover
            e.stopPropagation()
          }}
        >
          <div 
            className="relative"
            onMouseDown={(e) => {
              // Prevent the popover from closing when interacting with checkboxes
              e.stopPropagation()
            }}
          >
            <button 
              className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700"
              onClick={(e) => {
                // Stop propagation to prevent triggering other click events
                e.stopPropagation()
                // Close the popover
                setIsOpen(false)
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="space-y-4 mt-6">
              <div>
                <h4 className="text-small font-bold mb-2">Группы</h4>
                {filterOptionsDisplay.groups.map(group => (
                  <Checkbox
                    key={group}
                    isSelected={filters.groups.includes(group)}
                    onValueChange={(isSelected) => {
                      setFilters(prev => ({
                        ...prev,
                        groups: isSelected 
                          ? [...prev.groups, group]
                          : prev.groups.filter(g => g !== group)
                      }))
                    }}
                    className="mb-1"
                    color="primary"
                  >
                    {group}
                  </Checkbox>
                ))}
              </div>

              <div>
                <h4 className="text-small font-bold mb-2">Тесты</h4>
                {filterOptionsDisplay.testNames.map(testName => (
                  <Checkbox
                    key={testName}
                    isSelected={filters.testNames.includes(testName)}
                    onValueChange={(isSelected) => {
                      setFilters(prev => ({
                        ...prev,
                        testNames: isSelected 
                          ? [...prev.testNames, testName]
                          : prev.testNames.filter(t => t !== testName)
                      }))
                    }}
                    className="mb-1"
                    color="primary"
                  >
                    {testName}
                  </Checkbox>
                ))}
              </div>

              <div>
                <h4 className="text-small font-bold mb-2">Категории</h4>
                <div className="grid grid-cols-2 gap-1">
                  {filterOptionsDisplay.categories.map(category => (
                    <Checkbox
                      key={category}
                      isSelected={filters.categories.includes(category)}
                      onValueChange={(isSelected) => {
                        setFilters(prev => ({
                          ...prev,
                          categories: isSelected 
                            ? [...prev.categories, category]
                            : prev.categories.filter(c => c !== category)
                        }))
                      }}
                      className="mb-1"
                      color="primary"
                    >
                      {category}
                    </Checkbox>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <motion.div 
      className="mx-auto p-4 sm:p-6 max-w-full relative bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="container mx-auto w-[95%] sm:w-full sm:max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-8"
        variants={containerVariants}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold text-center sm:text-left text-gray-800 dark:text-white mb-2 sm:mb-0">
            Результаты тестирования
          </h1>
          <div className="flex items-center space-x-2">
            <Button 
              variant="bordered" 
              color="primary" 
              size="sm"
              className="w-full sm:w-auto"
              startContent={<FileText size={16} />}
            >
              Экспорт
            </Button>
            <FilterPopover />
          </div>
        </div>

        <div className="w-full mb-4">
          <Input
            type="text"
            placeholder="Поиск по результатам"
            size="sm"
            value={searchQuery}
            onValueChange={setSearchQuery}
            isClearable
            startContent={<Search size={16} />}
            className="w-full"
            classNames={{
              inputWrapper: "bg-gray-100 dark:bg-gray-700 rounded-xl",
              input: "text-xs sm:text-sm"
            }}
          />
        </div>

        <div className="w-full">
          <Table 
            aria-label="Результаты тестов"
            color="primary"
            removeWrapper
            className="w-full"
            classNames={{
              table: "w-full",
              th: "text-gray-700 dark:text-white text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-700",
              td: "text-gray-700 dark:text-white text-[10px] sm:text-xs p-2"
            }}
          >
            <TableHeader>
              <TableColumn className="text-[10px] sm:text-xs">ФИО</TableColumn>
              <TableColumn className="text-[10px] sm:text-xs hidden sm:table-cell">Группа</TableColumn>
              <TableColumn className="text-[10px] sm:text-xs hidden sm:table-cell">Тест</TableColumn>
              <TableColumn className="text-[10px] sm:text-xs hidden sm:table-cell">Дата завершения</TableColumn>
              <TableColumn className="text-[10px] sm:text-xs">Ср. балл группы</TableColumn>
              <TableColumn className="text-[10px] sm:text-xs hidden sm:table-cell">Категории</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Нет результатов">
              {filteredResults.map((result) => (
                <TableRow key={result.id} className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <TableCell className="p-2">
                    <div className="flex flex-col">
                      <span className="font-semibold text-[10px] sm:text-xs">{result.studentName}</span>
                      <div className="sm:hidden flex flex-col gap-1 mt-1 text-[9px]">
                        <span className="flex items-center">
                          <span className="mr-2 font-medium">Группа:</span> {result.group}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-2 font-medium">Тест:</span> {result.testName}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-2 font-medium">Дата:</span> {result.completedAt}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-2 font-medium">Категории:</span> {result.categories.join(', ')}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell p-2">{result.group}</TableCell>
                  <TableCell className="hidden sm:table-cell p-2">{result.testName}</TableCell>
                  <TableCell className="hidden sm:table-cell p-2">{result.completedAt}</TableCell>
                  <TableCell className="p-2">
                    <Chip 
                      color={getStressLevelColor(result.averageStressScore)} 
                      variant="flat"
                      size="sm"
                      className="text-[9px] sm:text-xs"
                    >
                      {result.averageStressScore.toFixed(1)}/{result.maxScore || 0}
                    </Chip>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell p-2">{result.categories.join(', ')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </motion.div>
  )
}
