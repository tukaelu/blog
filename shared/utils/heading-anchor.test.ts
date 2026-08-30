import { describe, expect, it } from 'vitest'
import { buildHeadingAnchors } from './heading-anchor'

describe('buildHeadingAnchors', () => {
  it('重複しない見出しはそのままアンカーにする', () => {
    expect(buildHeadingAnchors(['A', 'B', 'C'])).toEqual(['A', 'B', 'C'])
  })

  it('同一テキストの重複にサフィックスを付与する', () => {
    expect(buildHeadingAnchors(['A', 'A', 'A'])).toEqual(['A', 'A-2', 'A-3'])
  })

  it('生成したサフィックスが別の見出しの実テキストと衝突しない', () => {
    expect(buildHeadingAnchors(['A', 'A', 'A-2'])).toEqual([
      'A',
      'A-2',
      'A-2-2',
    ])
  })
})
