import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import EmbedNodeView from './EmbedNodeView.vue'

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
