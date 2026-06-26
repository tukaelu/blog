import CodeBlock from '@tiptap/extension-code-block'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import CodeBlockNodeView from './CodeBlockNodeView.vue'

// 標準のCodeBlockにファイルパス属性を追加する（要件定義書 §5.4、architecture.md §4.2）。
// シンタックスハイライトはエディタ内では行わず、公開ページのレンダリング時にShikiで行う（実装コストと執筆体験のバランス）。
export const CodeBlockWithFilepath = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      filepath: { default: null },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(CodeBlockNodeView)
  },
})
