import { PrismaClient, User as PrismaUser } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { DefaultSession } from 'next-auth'

// Extend the default session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      login: string
    } & DefaultSession['user']
  }

  // Add role to the User type
  interface User {
    id: string
    role: string
    login: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    login: string
  }
}

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  // Add secret key
  secret: process.env.NEXTAUTH_SECRET,
  
  // Increase token encryption settings
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  session: {
    strategy: 'jwt', // Explicitly set JWT strategy
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        login: { label: "Login", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        
        if (!credentials?.login || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { login: credentials.login }
          })


          if (!user) {
            return null
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password, 
            user.password
          )

          if (!isPasswordCorrect) {
            return null
          }

          return {
            id: user.id,
            login: user.login,
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      
      if (user) {
        token.role = user.role
        token.login = user.login
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      
      session.user.role = token.role as string
      session.user.login = token.login as string
      session.user.id = token.id as string
      
      if (!session.user.role) {
        session.user.role = token.role as string
      }
      
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
}

// Helper function to hash password
export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10)
}
