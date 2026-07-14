import { getPrisma } from '../src/server/db'

const prisma = getPrisma()

try {
  await prisma.$queryRaw`SELECT 1`
  console.info('Database connection is healthy.')
} finally {
  await prisma.$disconnect()
}
