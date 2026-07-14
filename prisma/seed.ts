import 'dotenv/config'
import { randomBytes } from 'node:crypto'

import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

import { PrismaClient } from '../src/generated/prisma/client'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required to seed')

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
})

const generatedPassword =
  process.env.SEED_ADMIN_PASSWORD ?? randomBytes(18).toString('base64url')

const onePixelPng = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+Wl3ZAAAAAElFTkSuQmCC',
    'base64',
  ),
)

async function seed() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Portfolio Administrator' },
  })

  const admin = await prisma.user.upsert({
    where: { username: 'vero' },
    update: {
      roles: { connect: { id: adminRole.id } },
    },
    create: {
      email: 'vero@example.test',
      username: 'vero',
      name: 'Vero',
      roles: { connect: { id: adminRole.id } },
      password: {
        create: { hash: await bcrypt.hash(generatedPassword, 12) },
      },
    },
  })

  await prisma.homePage.upsert({
    where: { id: 'seed-homepage' },
    update: {},
    create: {
      id: 'seed-homepage',
      title: '¡Hola!',
      text: 'Welcome to my art portfolio.',
    },
  })

  for (const [index, title] of [
    'Blooming',
    'For my mom',
    'Reflection',
    'Serenity',
  ].entries()) {
    const id = `seed-painting-${index + 1}`
    await prisma.painting.upsert({
      where: { id },
      update: {},
      create: {
        id,
        title,
        content: `A seeded description for ${title}.`,
        price: String((index + 1) * 100),
        measures: '20 × 20 cm',
        ownerId: admin.id,
        createdAt: new Date(Date.UTC(2024, 0, index + 1)),
        images: {
          create: {
            id: `${id}-image`,
            altText: title,
            contentType: 'image/png',
            blob: onePixelPng,
          },
        },
      },
    })
  }

  console.info('Seeded non-production portfolio data.')
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.info(`Generated Administrator password: ${generatedPassword}`)
  }
}

seed()
  .finally(() => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
