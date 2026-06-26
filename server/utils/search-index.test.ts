import { describe, expect, it } from 'vitest'
import { buildFtsQuery, segmentJapanese } from './search-index'

describe('segmentJapanese', () => {
  it('segments Japanese text into words separated by spaces', () => {
    const result = segmentJapanese('東京都に住んでいます')
    expect(result.split(' ').length).toBeGreaterThan(1)
    expect(result).not.toContain('  ')
  })
})

describe('buildFtsQuery', () => {
  it('wraps each segmented token in double quotes for a phrase-safe AND query', () => {
    expect(buildFtsQuery('cat dog')).toBe('"cat" "dog"')
  })

  it('escapes embedded double quotes', () => {
    // Intl.Segmenter は " を独立したトークンとして分割するため、そのトークン自身もエスケープされる
    expect(buildFtsQuery('a"b')).toBe('"a" """" "b"')
  })
})
