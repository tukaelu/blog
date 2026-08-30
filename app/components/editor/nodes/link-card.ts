import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import LinkCardNodeView from './LinkCardNodeView.vue'

// URLをリッチな埋め込みカードに変換するノード（architecture.md §4.2）。
// atom（子コンテンツを持たない）block ノードとして実装する。
export const LinkCard = Node.create({
  name: 'linkCard',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      url: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="link-card"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'link-card' }),
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(LinkCardNodeView)
  },
})
