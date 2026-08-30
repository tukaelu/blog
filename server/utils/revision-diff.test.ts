import { describe, expect, it } from 'vitest'
import type { TiptapNode } from '#shared/types/tiptap-nodes'
import {
  diffBodyText,
  diffPlainText,
  extractRevisionText,
} from './revision-diff'

describe('extractRevisionText', () => {
  it('joins block-level node text with newlines', () => {
    const doc: TiptapNode = {
      type: 'doc',
      content: [
        { type: 'heading', content: [{ type: 'text', text: '背景' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '本文' }] },
      ],
    }
    expect(extractRevisionText(doc)).toBe('背景\n本文')
  })
})

describe('diffPlainText', () => {
  it('marks unchanged, removed, and added characters', () => {
    expect(diffPlainText('サンプル記事', 'サンプル投稿')).toEqual([
      { type: 'equal', value: 'サンプル' },
      { type: 'removed', value: '記事' },
      { type: 'added', value: '投稿' },
    ])
  })
})

describe('diffBodyText', () => {
  it('diffs line by line', () => {
    expect(diffBodyText('段落1\n段落2', '段落1\n段落2改訂')).toEqual([
      { type: 'equal', value: '段落1\n' },
      { type: 'removed', value: '段落2' },
      { type: 'added', value: '段落2改訂' },
    ])
  })
})
