'use client'

import React, { useState } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { signOut } from 'next-auth/react'
import { 
  Navbar, 
  NavbarBrand, 
  NavbarContent, 
  NavbarItem, 
  Link,
  Button,
  Tooltip,
  Drawer,
  DrawerContent,
  useDisclosure
} from "@nextui-org/react"
import { 
  FileText, 
  Users, 
  Sun, 
  Moon, 
  LogOut, 
  Home, 
  List,
  Settings,
  BookOpen,
  Menu,
  X
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [themeTransition, setThemeTransition] = useState(false)
  const { isOpen, onClose, onOpen } = useDisclosure()

  const toggleTheme = () => {
    setThemeTransition(true)

    setTimeout(() => {
      setTheme(theme === 'light' ? 'dark' : 'light')
      setThemeTransition(false)
    }, 300)
  }

  const navItems = [
    { 
      href: '/a/dashboard', 
      icon: <Home />, 
      label: 'Главная' 
    },
    { 
      href: '/a/users', 
      icon: <Users />, 
      label: 'Кураторы' 
    },
    { 
      href: '/a/tests', 
      icon: <List />, 
      label: 'Тесты' 
    },
    { 
      href: '/a/results', 
      icon: <FileText />, 
      label: 'Результаты' 
    },
    { 
      href: '/a/group', 
      icon: <BookOpen />, 
      label: 'Группы' 
    },
    { 
      href: '/a/student-categories', 
      icon: <List />, 
      label: 'Категории' 
    }
  ]

  const logout = () => {
    signOut()
    router.push('/login')
  }

  const renderNavItems = (isMobile = false) => (
    <>
      {navItems.map((item) => (
        <NavbarItem 
          key={item.href} 
          isActive={pathname === item.href}
          className={isMobile ? 'w-full' : ''}
        >
          <Link 
            color={pathname === item.href ? 'primary' : 'foreground'}
            href={item.href}
            onPress={onClose}
            className={`
              flex items-center gap-2 
              text-gray-800 dark:text-white 
              hover:text-blue-600 dark:hover:text-blue-400
              ${isMobile ? 'w-full p-4 text-lg' : ''}
            `}
          >
            {item.icon}
            {item.label}
          </Link>
        </NavbarItem>
      ))}
    </>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
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

      <Navbar 
        isBordered 
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md"
      >
        <NavbarBrand className="flex items-center justify-between w-full">
          <p className="font-bold text-gray-800 dark:text-white">Психологический Тестер</p>
          
          {/* Mobile Menu Trigger */}
          <div className="sm:hidden">
            <Button 
              isIconOnly 
              variant="light" 
              className="text-gray-800 dark:text-white"
              onPress={onOpen}
            >
              <Menu />
            </Button>
            <Drawer 
              isOpen={isOpen} 
              onClose={onClose}
              placement="left"
              backdrop="blur"
              className='w-[70%]'
              hideCloseButton
            >
              <DrawerContent>
                <div className="flex flex-col items-start w-full p-4 space-y-4">
                  <div className="flex justify-between items-center w-full mb-4">
                    <p className="text-xl font-bold text-gray-800 dark:text-white">Меню</p>
                    <Button 
                      isIconOnly 
                      variant="light" 
                      onPress={onClose}
                    >
                      <X />
                    </Button>
                  </div>
                  <div className="flex flex-col w-full space-y-2">
                    {renderNavItems(true)}
                  </div>
                  <div className="flex justify-between w-full mt-auto p-4">
                    <Tooltip 
                      content={theme === 'light' ? 'Темная тема' : 'Светлая тема'}
                      classNames={{
                        content: "text-gray-700 dark:text-white bg-white dark:bg-gray-800"
                      }}
                    >
                      <Button 
                        isIconOnly 
                        variant="light" 
                        onPress={toggleTheme}
                        className="text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {theme === 'light' ? <Moon /> : <Sun />}
                      </Button>
                    </Tooltip>

                    <Tooltip 
                      content="Выйти"
                      classNames={{
                        content: "text-gray-700 dark:text-white bg-white dark:bg-gray-800 text-sm font-medium py-2 px-4 bg-gray-100 dark:bg-gray-700 rounded-md"
                      }}
                    >
                      <Button 
                        isIconOnly 
                        variant="light" 
                        color="danger"
                        onPress={logout}
                        className="text-gray-800 dark:text-white hover:text-red-600 dark:hover:text-red-400"
                      >
                        <LogOut />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </NavbarBrand>

        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          {renderNavItems()}
        </NavbarContent>

        <NavbarContent justify="center" className="hidden sm:flex">
          <NavbarItem>
            <Tooltip 
              content={theme === 'light' ? 'Темная тема' : 'Светлая тема'}
              classNames={{
                content: "text-gray-700 dark:text-white bg-white dark:bg-gray-800"
              }}
            >
              <Button 
                isIconOnly 
                variant="light" 
                onPress={toggleTheme}
                className="text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
              >
                {theme === 'light' ? <Moon /> : <Sun />}
              </Button>
            </Tooltip>
          </NavbarItem>
          <NavbarItem>
            <Tooltip 
              content="Выйти"
              classNames={{
                content: "text-gray-700 dark:text-white bg-white dark:bg-gray-800 text-sm font-medium py-2 px-4 bg-gray-100 dark:bg-gray-700 rounded-md"
              }}
            >
              <Button 
                isIconOnly 
                variant="light" 
                color="danger"
                onPress={logout}
                className="text-gray-800 dark:text-white hover:text-red-600 dark:hover:text-red-400"
              >
                <LogOut />
              </Button>
            </Tooltip>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <main className="p-6">
        {children}
      </main>
    </div>
  )
}
