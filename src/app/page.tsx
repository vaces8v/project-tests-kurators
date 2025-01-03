'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  CheckCircle, 
  Users, 
  TrendingUp, 
  Zap, 
  Rocket 
} from 'lucide-react'
import { Button as NextUIButton } from '@nextui-org/react'
import Link from 'next/link'
import Particles from 'react-tsparticles'
import type { Engine } from '@tsparticles/engine'
import { loadFull } from 'tsparticles'
import type { Container } from '@tsparticles/engine'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/react'

export default function Home() {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    // Check initial width
    checkMobile()
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile)
    
    // Cleanup event listener
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine)
  }, [])

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    console.log('Particles container loaded', container)
  }, [])

  const features = [
    {
      icon: <BookOpen className="w-12 h-12 text-blue-500" />,
      title: 'Умные Тесты',
      description: 'Создавайте интерактивные тесты с различными типами вопросов: от множественного выбора до развернутых ответов.'
    },
    {
      icon: <Users className="w-12 h-12 text-green-500" />,
      title: 'Групповое Управление',
      description: 'Легко назначайте тесты для целых групп и отслеживайте прогресс каждого студента.'
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-purple-500" />,
      title: 'Аналитика Результатов',
      description: 'Получайте детальную статистику и идеи для улучшения образовательного процесса.'
    }
  ]

  const heroVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
        type: "spring",
        stiffness: 100
      }
    }
  }

  const futureUpdates = [
    {
      title: 'Искусственный Интеллект',
      description: 'Куда же без него в наши дни!'
    },
    {
      title: 'Адаптивное Тестирование',
      description: 'Динамическая сложность вопросов в зависимости от уровня знаний студента'
    },
    {
      title: 'Расширенная Аналитика',
      description: 'Глубокий анализ прогресса и рекомендации по улучшению обучения'
    },
    {
      title: 'Интеграция с Популярными Системами',
      description: 'Прямая синхронизация с популярными системами управления обучением'
    }
  ]

  const handleOpenBottomSheet = () => {
    setIsBottomSheetOpen(true)
  }

  const handleCloseBottomSheet = () => {
    setIsBottomSheetOpen(false)
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
      {/* Particles Background */}
      <Particles
        id="tsparticles"
        //@ts-ignore
        init={particlesInit}
        //@ts-ignore
        loaded={particlesLoaded}
        options={{
          particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: ["#3B82F6", "#60A5FA", "#93C5FD"] },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: false },
            size: { value: 3, random: true },
            move: {
              enable: true,
              speed: 1,
              direction: "top",
              random: false,
              straight: false,
              out_mode: "out",
              bounce: false
            }
          },
          interactivity: {
            detect_on: "canvas",
            events: {
              onhover: { enable: true, mode: "repulse" },
              onclick: { enable: true, mode: "push" },
              resize: true
            }
          },
          retina_detect: true
        }}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-4">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={heroVariants}
          className="text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-gradient-x">
            Умная Система Тестирования Кураторов 🚀
          </h1>
          
          <p className="text-base text-gray-600 max-w-2xl mx-auto mb-6">
            Революционная платформа для создания, управления и анализа образовательных тестов. 
            Превратите оценивание знаний в увлекательный и эффективный процесс! 📊✨
          </p>

          <div className="flex justify-center space-x-3 mb-8">
            <Link href="/login">
              <NextUIButton 
                color="primary" 
                size="md" 
                className="px-4 py-2 text-sm font-semibold"
                startContent={<Rocket className="mr-1 w-4 h-4" />}
              >
                Начать Работу
              </NextUIButton>
            </Link>
            <NextUIButton 
              color="secondary" 
              variant="bordered" 
              size="md" 
              className="px-4 py-2 text-sm font-semibold"
              startContent={<Zap className="mr-1 w-4 h-4" />}
              onPress={handleOpenBottomSheet}
            >
              Узнать Больше
            </NextUIButton>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.2,
                  duration: 0.5
                }}
                className="bg-white/70 backdrop-blur-lg p-4 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <div className="mb-2 flex justify-center">
                  {React.cloneElement(feature.icon, { className: "w-8 h-8 text-blue-500" })}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Additional Features and Benefits Section */}
      <div className="bg-white/80 backdrop-blur-lg py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Почему платформа удобная?
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Мы создали простую систему, которая делает процесс тестирования удобным, эффективным и увлекательным.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <CheckCircle className="w-10 h-10 text-green-500" />,
                title: 'Интуитивный Интерфейс',
                description: 'Легкость использования для преподавателей и студентов. Никаких сложных настроек.'
              },
              {
                icon: <TrendingUp className="w-10 h-10 text-blue-500" />,
                title: 'Глубокая Аналитика',
                description: 'Мгновенные отчеты и визуализация прогресса студентов с умными графиками.'
              },
              {
                icon: <Users className="w-10 h-10 text-purple-500" />,
                title: 'Масштабируемость',
                description: 'Быстрая возможность создания огромного количества групп.'
              },
              {
                icon: <Zap className="w-10 h-10 text-yellow-500" />,
                title: 'Быстрая Настройка',
                description: 'Создайте первый тест за считанные минуты. Никаких долгих внедрений.'
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: index * 0.2,
                  duration: 0.5
                }}
                viewport={{ once: true }}
                className="bg-white/60 backdrop-blur-md p-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-start space-x-5"
              >
                <div className="flex-shrink-0">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Future Updates Bottom Sheet */}
      <Modal 
        isOpen={isBottomSheetOpen} 
        onOpenChange={handleCloseBottomSheet}
        placement={isMobile ? "bottom" : "center"}
        size="2xl"
        backdrop="blur"
        classNames={{
          base: `bg-white text-black ${isMobile ? '' : 'md:rounded-xl'}`,
          header: "border-b-[1px] border-gray-200",
          body: "bg-white",
          footer: "border-t-[1px] border-gray-200"
        }}
        scrollBehavior="inside"
      >
        <ModalContent className="max-h-[90vh] md:max-h-[80vh]">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-blue-600">
                  Будущие Обновления
                </h2>
                <p className="text-sm text-gray-500">
                  Мы постоянно работаем над улучшением платформы
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {futureUpdates.map((update, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-all"
                    >
                      <h3 className="text-base font-semibold text-gray-800 mb-2">
                        {update.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {update.description}
                      </p>
                    </div>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter>
                <NextUIButton color="primary" onPress={onClose}>
                  Закрыть
                </NextUIButton>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
