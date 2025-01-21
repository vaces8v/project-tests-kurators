import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Hash the password
  const hashedPassword = bcrypt.hashSync('6676', 10)

  // Create admin user or get existing one
  const adminUser = await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      login: 'admin',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })

  console.log('Admin user ID:', adminUser.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
