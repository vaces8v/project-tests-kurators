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

export default function CuratorLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [themeTransition, setThemeTransition] = useState(false)


  const navItems = [
    { 
      href: '/curator/tests', 
      icon: <List />, 
      label: 'Тесты' 
    },
    { 
      href: '/curator/students', 
      icon: <Users />, 
      label: 'Студенты' 
    },
    { 
      href: '/curator/test-results', 
      icon: <FileText />, 
      label: 'Результаты' 
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

        <NavbarContent justify="end">
          <NavbarItem>
            <Tooltip 
              content="Выйти"
              classNames={{
                content: "text-gray-700 dark:text-white bg-white dark:bg-gray-800"
              }}
            >
              <Button 
                isIconOnly 
                variant="light" 
                onPress={logout}
                className="text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <LogOut />
              </Button>
            </Tooltip>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <main className="p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
