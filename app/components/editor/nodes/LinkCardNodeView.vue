<script setup lang="ts">
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

function onInput(e: Event) {
  props.updateAttributes({ url: (e.target as HTMLInputElement).value })
}
</script>

<template>
  <NodeViewWrapper data-type="link-card">
    <!-- カーソル/選択がこのノードに無い間は公開ページと同じプレビューを表示し、
         選択されたとき（クリック・カーソル移動でのNodeSelection）だけURL編集フォームに切り替える -->
    <SiteNodesLinkCard
      v-if="!selected && node.attrs.url"
      :url="node.attrs.url"
    />
    <input
      v-else
      :value="node.attrs.url"
      placeholder="https://... （リンクカードのURL）"
      @input="onInput"
    />
  </NodeViewWrapper>
</template>
