import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import EmbedNodeView from './EmbedNodeView.vue'

// GitHub/YouTube/X/Instagramの埋め込み（architecture.md §4.2）。
// provider は挿入時にツールバー側で固定し、ノード自体では自動判定しない。
export const Embed = Node.create({
  name: 'embed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      provider: { default: '' },
      url: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="embed"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'embed' })]
  },

  addNodeView() {
    return VueNodeViewRenderer(EmbedNodeView)
  },
})
