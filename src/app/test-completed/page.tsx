'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { Button } from '@nextui-org/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import Confetti to prevent SSR issues
const Confetti = dynamic(() => import('react-confetti'), { 
  ssr: false 
})

export default function TestCompletedPage() {
  const router = useRouter()
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    // Set window size on client-side
    setWindowSize({ 
      width: window.innerWidth, 
      height: window.innerHeight 
    })
    
    // Trigger confetti
    setShowConfetti(true)

    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.6,
        type: "spring",
        stiffness: 100
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4 overflow-hidden relative">
      {showConfetti && windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          colors={[
            '#FF6B6B',   // Coral Red
            '#4ECDC4',   // Turquoise
            '#45B7D1',   // Sky Blue
            '#FDCB6E',   // Sunflower Yellow
            '#6C5CE7',   // Purple
            '#A8E6CF',   // Mint Green
            '#FF8ED4',   // Pink
            '#FAD390',   // Soft Orange
            '#6A89CC',   // Muted Blue
            '#7ED6DF',   // Light Blue
            '#FF9FF3',   // Pastel Pink
            '#54A0FF',   // Bright Blue
            '#5F27CD',   // Deep Purple
            '#01CBC6',   // Teal
            '#FF6F61'    // Vibrant Coral
          ]}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            zIndex: 10 
          }}
        />
      )}
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center max-w-xl w-full p-8 bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl relative z-20"
      >
        <div className="mb-6">
          <CheckCircle 
            className="mx-auto mb-4 text-green-500" 
            size={80} 
            strokeWidth={1.5}
          />
          
          <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-gradient-x">
            Тест успешно пройден!
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            Поздравляем! Вы завершили тест и отправили свои ответы. 
            Результаты будут доступны вашему куратору.
          </p>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Button 
            color="primary" 
            variant="solid"
            onPress={() => router.push('/')}
            className="px-6 py-3"
          >
            На главную
          </Button>
          <Button 
            color="secondary" 
            variant="bordered"
            onPress={() => router.push('/dashboard')}
            className="px-6 py-3"
          >
            Личный кабинет
          </Button>
        </div>
      </motion.div>

      {/* Animated background elements */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      >
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-300 rounded-full blur-2xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-purple-300 rounded-full blur-2xl opacity-50 animate-blob animation-delay-2000"></div>
      </motion.div>
    </div>
  )
}
