import { describe, expect, it } from 'vitest'
import { markdownToTiptap } from './migrate-posts.mdast-to-tiptap'

describe('markdownToTiptap', () => {
  it('見出し・段落・強調・リンク・インラインコードを変換する', () => {
    const { doc, manualReview } = markdownToTiptap(
      '## 見出し\n\n本文は**太字**と`code`と[リンク](https://example.com/)を含む。'
    )
    expect(manualReview).toEqual([])
    expect(doc).toEqual({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '見出し' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '本文は' },
            { type: 'text', text: '太字', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'と' },
            { type: 'text', text: 'code', marks: [{ type: 'code' }] },
            { type: 'text', text: 'と' },
            {
              type: 'text',
              text: 'リンク',
              marks: [
                { type: 'link', attrs: { href: 'https://example.com/' } },
              ],
            },
            { type: 'text', text: 'を含む。' },
          ],
        },
      ],
    })
  })

  it('ネストしたリスト・引用・コードブロックを変換する', () => {
    const { doc, manualReview } = markdownToTiptap(
      '- 項目1\n  - 子項目\n\n> 引用\n\n```js\nconsole.log(1)\n```\n'
    )
    expect(manualReview).toEqual([])
    expect(doc.content).toEqual([
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: '項目1' }] },
              {
                type: 'bulletList',
                content: [
                  {
                    type: 'listItem',
                    content: [
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: '子項目' }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'blockquote',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '引用' }] },
        ],
      },
      {
        type: 'codeBlock',
        attrs: { language: 'js', filepath: null },
        content: [{ type: 'text', text: 'console.log(1)' }],
      },
    ])
  })

  it('画像単独の段落をblockレベルのimageノードへ分離する', () => {
    const { doc } = markdownToTiptap('前置き\n\n![alt](./a.webp)\n\n後書き')
    expect(doc.content).toEqual([
      { type: 'paragraph', content: [{ type: 'text', text: '前置き' }] },
      { type: 'image', attrs: { src: './a.webp', alt: 'alt' } },
      { type: 'paragraph', content: [{ type: 'text', text: '後書き' }] },
    ])
  })

  it('脚注参照と脚注定義をfootnoteノードへ変換し、定義は本文から除去する', () => {
    const { doc, manualReview } = markdownToTiptap(
      '参照[^1]する。\n\n[^1]: 脚注の中身'
    )
    expect(manualReview).toEqual([])
    expect(doc.content).toEqual([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '参照' },
          { type: 'footnote', attrs: { content: '脚注の中身' } },
          { type: 'text', text: 'する。' },
        ],
      },
    ])
  })

  it('脚注定義にリンク等の書式が含まれる場合はプレーンテキスト化した上で警告する', () => {
    const { doc, manualReview } = markdownToTiptap(
      '参照[^1]する。\n\n[^1]: [外部リンク](https://example.com/)'
    )
    expect(doc.content?.[0]).toEqual({
      type: 'paragraph',
      content: [
        { type: 'text', text: '参照' },
        { type: 'footnote', attrs: { content: '外部リンク' } },
        { type: 'text', text: 'する。' },
      ],
    })
    expect(manualReview).toHaveLength(1)
    expect(manualReview[0]).toContain('脚注 [^1]')
  })

  it('<EmbeddedLink url="..." />をlinkCardノードへ変換する', () => {
    const { doc, manualReview } = markdownToTiptap(
      'import EmbeddedLink from \'@components/mdx/EmbeddedLink.astro\'\n\n<EmbeddedLink url="https://example.com/" />\n'
    )
    expect(manualReview).toEqual([])
    expect(doc.content).toEqual([
      { type: 'linkCard', attrs: { url: 'https://example.com/' } },
    ])
  })

  it('未対応のHTML/JSXブロックは本文から除去し、要手動確認リストに記録する', () => {
    const { doc, manualReview } = markdownToTiptap(
      '<div class="iframely-embed">\n  <a href="https://example.com/">example</a>\n</div>\n<script async src="//example.com/embed.js"></script>\n\n続き'
    )
    expect(doc.content).toEqual([
      { type: 'paragraph', content: [{ type: 'text', text: '続き' }] },
    ])
    expect(manualReview).toHaveLength(1)
    expect(manualReview[0]).toContain('未対応のHTML/JSX構文')
  })

  it('改行（hardBreak）を変換する', () => {
    const { doc } = markdownToTiptap('1行目  \n2行目')
    expect(doc.content).toEqual([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '1行目' },
          { type: 'hardBreak' },
          { type: 'text', text: '2行目' },
        ],
      },
    ])
  })
})
