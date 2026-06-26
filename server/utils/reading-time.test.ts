import { describe, expect, it } from 'vitest'
import { calcReadingTimeMinutes } from './reading-time'

describe('calcReadingTimeMinutes', () => {
  it('rounds up to the nearest minute at 400 chars/min', () => {
    expect(calcReadingTimeMinutes('あ'.repeat(400))).toBe(1)
    expect(calcReadingTimeMinutes('あ'.repeat(401))).toBe(2)
    expect(calcReadingTimeMinutes('あ'.repeat(800))).toBe(2)
  })

  it('returns at least 1 minute for empty or very short text', () => {
    expect(calcReadingTimeMinutes('')).toBe(1)
    expect(calcReadingTimeMinutes('短い')).toBe(1)
  })
})
