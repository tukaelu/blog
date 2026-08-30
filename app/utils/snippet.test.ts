import { describe, expect, it } from 'vitest'
import { parseSnippet } from './snippet'

describe('parseSnippet', () => {
  it('splits text around <mark> tags', () => {
    expect(
      parseSnippet('...Cloudflare <mark>Workers</mark>で構築した...')
    ).toEqual([
      { text: '...Cloudflare ', highlighted: false },
      { text: 'Workers', highlighted: true },
      { text: 'で構築した...', highlighted: false },
    ])
  })

  it('returns a single non-highlighted part when there is no mark', () => {
    expect(parseSnippet('plain text')).toEqual([
      { text: 'plain text', highlighted: false },
    ])
  })

  it('handles multiple mark tags', () => {
    expect(parseSnippet('<mark>a</mark>-<mark>b</mark>')).toEqual([
      { text: 'a', highlighted: true },
      { text: '-', highlighted: false },
      { text: 'b', highlighted: true },
    ])
  })
})
