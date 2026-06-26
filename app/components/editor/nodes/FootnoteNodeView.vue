<script setup lang="ts">
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

function onInput(e: Event) {
  props.updateAttributes({ content: (e.target as HTMLInputElement).value })
}
</script>

<template>
  <NodeViewWrapper as="span" data-type="footnote" style="display: inline-block">
    <!-- 公開ページの上付き連番表示は出現順カウンター(provide/inject)に依存しており
         このノード単体では再現できないため、ここでは内容テキストのプレビューに留める -->
    <sup v-if="!selected && node.attrs.content">[{{ node.attrs.content }}]</sup>
    <template v-else
      >[<input
        :value="node.attrs.content"
        placeholder="脚注の内容"
        style="width: 12em"
        @input="onInput"
      />]</template
    >
  </NodeViewWrapper>
</template>
