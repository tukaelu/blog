import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import FootnoteNodeView from './FootnoteNodeView.vue'

// 脚注ノード。参照元に上付き番号を表示し、本文末尾に一覧を集約する（architecture.md §4.2, §4.3）。
export const Footnote = Node.create({
  name: 'footnote',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      content: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="footnote"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-type': 'footnote' }),
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(FootnoteNodeView)
  },
})
