import { describe, expect, it } from 'vitest'
import type { TiptapNode } from '#shared/types/tiptap-nodes'
import { buildToc } from './toc'

describe('buildToc', () => {
  it('extracts heading nodes of level 2-4 in order', () => {
    const doc: TiptapNode = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: '本文' }] },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '背景' }],
        },
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: '無視されるH1' }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: '詳細' }],
        },
      ],
    }

    expect(buildToc(doc)).toEqual([
      { level: 2, text: '背景', anchor: '背景' },
      { level: 3, text: '詳細', anchor: '詳細' },
    ])
  })

  it('returns an empty array when there are no headings', () => {
    const doc: TiptapNode = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: '本文のみ' }] },
      ],
    }
    expect(buildToc(doc)).toEqual([])
  })
})
