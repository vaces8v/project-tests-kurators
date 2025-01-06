'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input, Button } from "@nextui-org/react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Lock, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [themeTransition, setThemeTransition] = useState(false)

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.3,
        type: "spring",
        stiffness: 150,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        type: "spring",
        stiffness: 150
      }
    }
  }

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    setThemeTransition(true)

    setTimeout(() => {
      setTheme(theme === 'light' ? 'dark' : 'light')
      setThemeTransition(false)
    }, 300)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        redirect: false, 
        login,
        password
      })


      if (result?.error) {
        toast.error('Ошибка входа', {
          description: result.error || 'Неверный логин или пароль'
        })
        setIsLoading(false)
        return
      }

      const session = await getSession()

      if (session?.user) {
        const redirectUrl = session.user.role === 'ADMIN' 
          ? '/a/dashboard' 
          : '/curator/tests'
        
        
        router.push(redirectUrl)
      } else {
        console.error('No session or user found')
        toast.error('Ошибка авторизации', {
          description: 'Не удалось получить сессию'
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Ошибка входа', {
        description: error instanceof Error ? error.message : 'Произошла неизвестная ошибка'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex w-full h-screen justify-center items-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 relative overflow-hidden">
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

      <motion.div 
        className={`w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl relative z-10 transition-colors duration-300 ${themeTransition ? 'opacity-50' : 'opacity-100'}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <button 
          onClick={toggleTheme} 
          className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
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

        <motion.h1 
          className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white"
          variants={itemVariants}
        >
          Войти в аккаунт
        </motion.h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div variants={itemVariants}>
            <Input
              type="text"
              label="Логин"
              placeholder="Введите логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              startContent={<User className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />}
              variant="bordered"
              fullWidth
              required
              classNames={{
                label: "py-1",
                input: [
                  "text-black dark:text-white",
                  "placeholder:text-default-700 dark:placeholder:text-default-500",
                  "focus:text-black dark:focus:text-white"
                ]
              }}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Input
              type="password"
              label="Пароль"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              startContent={<Lock className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />}
              variant="bordered"
              fullWidth
              required
              classNames={{
                label: "py-1",
                input: [
                  "text-black dark:text-white",
                  "placeholder:text-default-700 dark:placeholder:text-default-500",
                  "focus:text-black dark:focus:text-white"
                ]
              }}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button 
              type="submit" 
              color="primary" 
              variant="shadow" 
              fullWidth 
              className="mt-4 text-lg"
              isLoading={isLoading}
            >
              {isLoading ? 'Входим...' : 'Войти'}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </main>
  )
}
