import { describe, expect, it } from 'vitest'
import { slugSchema, slugifyTagName } from './slug'

describe('slugSchema', () => {
  it('accepts lowercase letters, numbers, and hyphens', () => {
    expect(slugSchema.safeParse('hello-world-2026').success).toBe(true)
  })

  it('rejects uppercase letters', () => {
    expect(slugSchema.safeParse('Hello-World').success).toBe(false)
  })

  it('rejects non-ASCII characters', () => {
    expect(slugSchema.safeParse('こんにちは').success).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(slugSchema.safeParse('').success).toBe(false)
  })

  it('rejects spaces', () => {
    expect(slugSchema.safeParse('hello world').success).toBe(false)
  })
})

describe('slugifyTagName', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifyTagName('Nuxt JS')).toBe('nuxt-js')
  })

  it('strips symbols and collapses separators', () => {
    expect(slugifyTagName('Q&A <script>')).toBe('q-a-script')
  })

  it('trims leading/trailing hyphens', () => {
    expect(slugifyTagName('  -Vue-  ')).toBe('vue')
  })

  it('falls back to a random id when nothing ASCII-alnum remains', () => {
    expect(slugSchema.safeParse(slugifyTagName('技術')).success).toBe(true)
  })
})
