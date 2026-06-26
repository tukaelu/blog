import { describe, expect, it } from 'vitest'
import { computeDisplayStatus } from './article-status'

describe('computeDisplayStatus', () => {
  it('returns 下書き for draft status regardless of publishedAt', () => {
    expect(computeDisplayStatus('draft', null)).toBe('下書き')
    expect(computeDisplayStatus('draft', '2020-01-01T00:00:00Z')).toBe('下書き')
  })

  it('returns 予約中 for published status with a future publishedAt', () => {
    expect(computeDisplayStatus('published', '2999-01-01T00:00:00Z')).toBe(
      '予約中'
    )
  })

  it('returns 公開済み for published status with a past publishedAt', () => {
    expect(computeDisplayStatus('published', '2020-01-01T00:00:00Z')).toBe(
      '公開済み'
    )
  })
})
