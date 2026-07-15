// Framework-independent cutover-readiness domain (PRD US 48, 51, 57).
//
// This module owns two concerns of the production cutover, both free of Prisma,
// cookies, and TanStack wiring so they can be unit-tested in isolation and
// driven from a thin script:
//   1. Invalidating every existing database Session so the new deployment
//      begins with fresh authentication (US 48).
//   2. Assessing production database compatibility from a read-only snapshot,
//      never mutating the data it inspects (US 51 and task 12).

/** Prisma models the rewritten product reads or writes at runtime. */
export const REQUIRED_MODELS = [
  'User',
  'Password',
  'Role',
  'Session',
  'Category',
  'HomePage',
  'HomepageImage',
  'Painting',
  'PaintingImage',
  'UserImage',
] as const

export type RequiredModel = (typeof REQUIRED_MODELS)[number]

/** The signer requires at least this many characters (mirrors env validation). */
export const MINIMUM_SESSION_SECRET_LENGTH = 32

// --- Session rotation (US 48) ---

export type SessionRotationRepository = {
  /** Delete every database Session; resolves with the number invalidated. */
  deleteAllSessions: () => Promise<number>
}

export type SessionRotation = {
  invalidatedSessions: number
}

/**
 * Cutover step that invalidates every existing database Session so that all
 * visitors — including the Administrator — must authenticate again. Combined
 * with rotating SESSION_SECRET, previously issued cookies also fail signature
 * verification, so neither the cookie nor its backing row survives cutover.
 */
export async function rotateSessions(input: {
  repository: SessionRotationRepository
}): Promise<SessionRotation> {
  const invalidatedSessions = await input.repository.deleteAllSessions()
  return { invalidatedSessions }
}

/**
 * Verify the production session secret is genuinely being rotated at cutover:
 * the replacement must differ from the previous secret (when one existed) and
 * still satisfy the minimum length the signer requires.
 */
export function isSessionSecretRotated(input: {
  previous: string | undefined
  next: string
}): boolean {
  if (input.next.length < MINIMUM_SESSION_SECRET_LENGTH) return false
  if (input.previous === undefined) return true
  return input.next !== input.previous
}

// --- Read-only production compatibility (US 51, task 12) ---

/**
 * A read-only view of the production database. Every field is derived from a
 * count or existence query; the assessment below performs no writes.
 */
export type CompatibilitySnapshot = {
  /** Required models whose table responded to a read query. */
  presentModels: ReadonlyArray<string>
  /** Whether the `admin` Role exists. */
  adminRolePresent: boolean
  /** Administrators (users with the admin role) that have a stored password. */
  administratorsWithPassword: number
  /** Number of HomePage rows; the product treats the Homepage as a singleton. */
  homepageRecords: number
  /** Total Paintings, regardless of public visibility. */
  totalPaintings: number
  /** Paintings with at least one image, and therefore publicly visible. */
  publiclyVisiblePaintings: number
}

export type CheckStatus = 'pass' | 'warn' | 'fail'

export type CompatibilityCheck = {
  id: string
  label: string
  status: CheckStatus
  detail: string
}

export type CompatibilityReport = {
  checks: ReadonlyArray<CompatibilityCheck>
  /** True when no check failed; warnings do not block cutover. */
  ready: boolean
}

/**
 * Turn a read-only production snapshot into an ordered list of pass/warn/fail
 * checks. A `fail` blocks cutover (schema or authentication is broken); a
 * `warn` is surfaced for human judgement but does not block. This function is
 * pure and inspects data only — it never mutates the database.
 */
export function assessProductionCompatibility(
  snapshot: CompatibilitySnapshot,
): CompatibilityReport {
  const present = new Set(snapshot.presentModels)
  const missingModels = REQUIRED_MODELS.filter((model) => !present.has(model))

  const checks: Array<CompatibilityCheck> = [
    {
      id: 'schema-models',
      label: 'Prisma schema compatibility',
      status: missingModels.length === 0 ? 'pass' : 'fail',
      detail:
        missingModels.length === 0
          ? `All ${REQUIRED_MODELS.length} required models are present.`
          : `Missing required models: ${missingModels.join(', ')}.`,
    },
    {
      id: 'admin-role',
      label: 'Administrator role present',
      status: snapshot.adminRolePresent ? 'pass' : 'fail',
      detail: snapshot.adminRolePresent
        ? 'The `admin` role exists.'
        : 'The `admin` role is missing; Administration access is impossible.',
    },
    {
      id: 'administrator-account',
      label: 'Administrator can log in after cutover',
      status: snapshot.administratorsWithPassword > 0 ? 'pass' : 'fail',
      detail:
        snapshot.administratorsWithPassword > 0
          ? `${snapshot.administratorsWithPassword} Administrator account(s) can authenticate.`
          : 'No Administrator has a stored password; fresh login would be impossible.',
    },
    {
      id: 'homepage-singleton',
      label: 'Homepage singleton',
      status: homepageStatus(snapshot.homepageRecords),
      detail: homepageDetail(snapshot.homepageRecords),
    },
    {
      id: 'portfolio-data',
      label: 'Portfolio data present',
      status: snapshot.totalPaintings > 0 ? 'pass' : 'warn',
      detail:
        snapshot.totalPaintings > 0
          ? `${snapshot.totalPaintings} Painting(s) found.`
          : 'No Paintings found; the portfolio is empty.',
    },
    {
      id: 'public-visibility',
      label: 'Publicly visible Paintings',
      status: snapshot.publiclyVisiblePaintings > 0 ? 'pass' : 'warn',
      detail:
        snapshot.publiclyVisiblePaintings > 0
          ? `${snapshot.publiclyVisiblePaintings} Painting(s) have an image and are public.`
          : 'No Painting has an image; the public gallery would be empty.',
    },
  ]

  return {
    checks,
    ready: checks.every((check) => check.status !== 'fail'),
  }
}

function homepageStatus(records: number): CheckStatus {
  if (records === 1) return 'pass'
  if (records === 0) return 'warn'
  return 'fail'
}

function homepageDetail(records: number): string {
  if (records === 1) return 'Exactly one HomePage record exists.'
  if (records === 0) return 'No HomePage record; the public Homepage is empty.'
  return `${records} HomePage records exist, violating the singleton invariant.`
}
