'use client'

import React, { useState } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Navbar, 
  NavbarBrand, 
  NavbarContent, 
  NavbarItem, 
  Link,
  Button,
  Tooltip
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
  BookOpen
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [themeTransition, setThemeTransition] = useState(false)

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
      label: 'Пользователи' 
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
    }
  ]

  const logout = () => {
    router.push('/login')
  }

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
        <NavbarBrand>
          <p className="font-bold text-gray-800 dark:text-white">Психологический Тестер</p>
        </NavbarBrand>

        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          {navItems.map((item) => (
            <NavbarItem 
              key={item.href} 
              isActive={pathname === item.href}
            >
              <Link 
                color={pathname === item.href ? 'primary' : 'foreground'}
                href={item.href}
                className="flex items-center gap-2 text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
              >
                {item.icon}
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent justify="center">
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
