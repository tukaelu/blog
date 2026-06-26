import { describe, expect, it } from 'vitest'
import { escapeXml } from './xml'

describe('escapeXml', () => {
  it('escapes the five predefined XML entities', () => {
    expect(escapeXml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;'
    )
  })

  it('leaves plain text unchanged', () => {
    expect(escapeXml('こんにちは')).toBe('こんにちは')
  })
})
