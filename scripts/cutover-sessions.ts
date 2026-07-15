// Cutover session-rotation procedure (PRD US 48).
//
// Run once at production cutover, AFTER the new SESSION_SECRET is in place, to
// invalidate every existing database Session. Rotating the secret alone breaks
// old cookie signatures; deleting the Session rows also removes their backing
// state, so every visitor — including the Administrator — must log in fresh.
//
// This is a deliberate, destructive-to-sessions step. It never touches
// portfolio content. Guard it behind an explicit confirmation flag so it
// cannot run by accident.
//
//   npx tsx scripts/cutover-sessions.ts --confirm

import { getPrisma } from '../src/server/db'

import { rotateSessions } from '../src/features/cutover/cutover'

const confirmed = process.argv.includes('--confirm')

if (!confirmed) {
  console.error(
    'Refusing to invalidate Sessions without --confirm. This logs out every user.',
  )
  process.exit(1)
}

const prisma = getPrisma()

try {
  const { invalidatedSessions } = await rotateSessions({
    repository: {
      async deleteAllSessions() {
        const { count } = await prisma.session.deleteMany({})
        return count
      },
    },
  })

  console.info(
    `Invalidated ${invalidatedSessions} database Session(s). All users must log in again.`,
  )
} finally {
  await prisma.$disconnect()
}
