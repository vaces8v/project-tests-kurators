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

        // Hardcoded admin check
        if (credentials.login === 'admin' && credentials.password === '6676') {
          return {
            id: 'admin-user-id',
            login: 'admin',
            email: 'admin@formsite.com',
            name: 'Admin User',
            role: 'ADMIN'
          }
        }

        const user = await prisma.user.findUnique({
          where: { login: credentials.login }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password, 
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          login: user.login,
          email: user.email,
          name: user.name,
          role: user.role
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
