import { describe, expect, it } from 'vitest'
import type { TiptapNode } from '#shared/types/tiptap-nodes'
import { extractFootnotes } from './footnotes'

describe('extractFootnotes', () => {
  it('numbers footnotes in document order starting at 1', () => {
    const doc: TiptapNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '本文1' },
            { type: 'footnote', attrs: { content: '注釈A' } },
            { type: 'text', text: '本文2' },
          ],
        },
        {
          type: 'paragraph',
          content: [{ type: 'footnote', attrs: { content: '注釈B' } }],
        },
      ],
    }

    expect(extractFootnotes(doc)).toEqual([
      { number: 1, content: '注釈A' },
      { number: 2, content: '注釈B' },
    ])
  })

  it('returns an empty array when there are no footnotes', () => {
    const doc: TiptapNode = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: '本文' }] },
      ],
    }
    expect(extractFootnotes(doc)).toEqual([])
  })
})
