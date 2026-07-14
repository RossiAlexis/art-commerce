import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '#/generated/prisma/client'

import { getServerEnv } from './env'

declare global {
  var __prisma: PrismaClient | undefined
}

export function getPrisma() {
  if (!globalThis.__prisma) {
    const adapter = new PrismaPg({
      connectionString: getServerEnv().DATABASE_URL,
    })
    globalThis.__prisma = new PrismaClient({ adapter })
  }

  return globalThis.__prisma
}
