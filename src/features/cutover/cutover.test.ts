import { describe, expect, it, vi } from 'vitest'

import {
  MINIMUM_SESSION_SECRET_LENGTH,
  REQUIRED_MODELS,
  assessProductionCompatibility,
  isSessionSecretRotated,
  rotateSessions,
} from './cutover'
import type { CompatibilitySnapshot } from './cutover'

const readySnapshot: CompatibilitySnapshot = {
  presentModels: [...REQUIRED_MODELS],
  adminRolePresent: true,
  administratorsWithPassword: 1,
  homepageRecords: 1,
  totalPaintings: 8,
  publiclyVisiblePaintings: 5,
}

describe('rotateSessions', () => {
  it('invalidates every existing database Session and reports the count', async () => {
    const deleteAllSessions = vi.fn(async () => 4)

    const result = await rotateSessions({ repository: { deleteAllSessions } })

    expect(deleteAllSessions).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ invalidatedSessions: 4 })
  })

  it('reports zero when there is nothing to invalidate', async () => {
    const result = await rotateSessions({
      repository: { deleteAllSessions: async () => 0 },
    })

    expect(result.invalidatedSessions).toBe(0)
  })
})

describe('isSessionSecretRotated', () => {
  const long = 'x'.repeat(MINIMUM_SESSION_SECRET_LENGTH)

  it('accepts a sufficiently long new secret when none was set before', () => {
    expect(isSessionSecretRotated({ previous: undefined, next: long })).toBe(
      true,
    )
  })

  it('rejects a new secret identical to the previous one', () => {
    expect(isSessionSecretRotated({ previous: long, next: long })).toBe(false)
  })

  it('rejects a new secret shorter than the minimum length', () => {
    expect(
      isSessionSecretRotated({ previous: undefined, next: 'too-short' }),
    ).toBe(false)
  })

  it('accepts a distinct, sufficiently long replacement secret', () => {
    expect(
      isSessionSecretRotated({ previous: long, next: `${long}-rotated` }),
    ).toBe(true)
  })
})

describe('assessProductionCompatibility', () => {
  it('marks a well-formed production database as ready without mutating it', () => {
    const report = assessProductionCompatibility(readySnapshot)

    expect(report.ready).toBe(true)
    expect(report.checks.every((check) => check.status !== 'fail')).toBe(true)
    expect(report.checks.map((check) => check.id)).toContain('schema-models')
  })

  it('fails when a required model is missing from the schema', () => {
    const report = assessProductionCompatibility({
      ...readySnapshot,
      presentModels: REQUIRED_MODELS.filter((model) => model !== 'Session'),
    })

    const schema = report.checks.find((check) => check.id === 'schema-models')
    expect(schema?.status).toBe('fail')
    expect(schema?.detail).toContain('Session')
    expect(report.ready).toBe(false)
  })

  it('fails when no Administrator account can log in after cutover', () => {
    const report = assessProductionCompatibility({
      ...readySnapshot,
      administratorsWithPassword: 0,
    })

    const account = report.checks.find(
      (check) => check.id === 'administrator-account',
    )
    expect(account?.status).toBe('fail')
    expect(report.ready).toBe(false)
  })

  it('fails when the singleton Homepage has more than one record', () => {
    const report = assessProductionCompatibility({
      ...readySnapshot,
      homepageRecords: 2,
    })

    const homepage = report.checks.find(
      (check) => check.id === 'homepage-singleton',
    )
    expect(homepage?.status).toBe('fail')
    expect(report.ready).toBe(false)
  })

  it('warns, but stays ready, when there is no publicly visible Painting yet', () => {
    const report = assessProductionCompatibility({
      ...readySnapshot,
      publiclyVisiblePaintings: 0,
    })

    const visibility = report.checks.find(
      (check) => check.id === 'public-visibility',
    )
    expect(visibility?.status).toBe('warn')
    expect(report.ready).toBe(true)
  })
})
