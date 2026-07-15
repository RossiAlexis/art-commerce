// Read-only production compatibility check (PRD US 51, task 12).
//
// Confirms the Prisma schema and expected portfolio data are compatible with
// the rewrite WITHOUT mutating anything: every query below is a connectivity
// probe, a count, or an existence read. Safe to run against production.
//
//   npm run db:check

import { getPrisma } from '../src/server/db'

import {
  REQUIRED_MODELS,
  assessProductionCompatibility,
} from '../src/features/cutover/cutover'
import type { CompatibilitySnapshot } from '../src/features/cutover/cutover'

const prisma = getPrisma()

/** Maps each required model to its Prisma client accessor for a count probe. */
const MODEL_COUNTERS: Record<
  (typeof REQUIRED_MODELS)[number],
  () => Promise<number>
> = {
  User: () => prisma.user.count(),
  Password: () => prisma.password.count(),
  Role: () => prisma.role.count(),
  Session: () => prisma.session.count(),
  Category: () => prisma.category.count(),
  HomePage: () => prisma.homePage.count(),
  HomepageImage: () => prisma.homepageImage.count(),
  Painting: () => prisma.painting.count(),
  PaintingImage: () => prisma.paintingImage.count(),
  UserImage: () => prisma.userImage.count(),
}

async function tableExists(model: (typeof REQUIRED_MODELS)[number]) {
  try {
    await MODEL_COUNTERS[model]()
    return true
  } catch {
    return false
  }
}

async function readSnapshot(): Promise<CompatibilitySnapshot> {
  const presence = await Promise.all(
    REQUIRED_MODELS.map(async (model) => ({
      model,
      present: await tableExists(model),
    })),
  )

  const [
    adminRole,
    administratorsWithPassword,
    homepageRecords,
    totalPaintings,
    publiclyVisiblePaintings,
  ] = await Promise.all([
    prisma.role.findFirst({ where: { name: 'admin' }, select: { id: true } }),
    prisma.user.count({
      where: { roles: { some: { name: 'admin' } }, password: { isNot: null } },
    }),
    prisma.homePage.count(),
    prisma.painting.count(),
    prisma.painting.count({ where: { images: { some: {} } } }),
  ])

  return {
    presentModels: presence.filter((p) => p.present).map((p) => p.model),
    adminRolePresent: adminRole !== null,
    administratorsWithPassword,
    homepageRecords,
    totalPaintings,
    publiclyVisiblePaintings,
  }
}

const ICON: Record<'pass' | 'warn' | 'fail', string> = {
  pass: '✓',
  warn: '!',
  fail: '✗',
}

try {
  await prisma.$queryRaw`SELECT 1`
  console.info('Database connection is healthy.\n')

  const report = assessProductionCompatibility(await readSnapshot())

  for (const check of report.checks) {
    console.info(`${ICON[check.status]} ${check.label}: ${check.detail}`)
  }

  console.info(
    `\nCutover readiness: ${report.ready ? 'READY (no failing checks)' : 'BLOCKED (failing checks above)'}`,
  )

  if (!report.ready) process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
