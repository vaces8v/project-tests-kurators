const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Hash the password
  const hashedPassword = await bcrypt.hash('6676', 10)

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      login: 'admin',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })

  console.log('Admin user created:', adminUser)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
