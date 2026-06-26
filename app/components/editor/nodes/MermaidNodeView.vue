<script setup lang="ts">
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

function onInput(e: Event) {
  props.updateAttributes({ source: (e.target as HTMLTextAreaElement).value })
}
</script>

<template>
  <NodeViewWrapper data-type="mermaid">
    <SiteNodesMermaid
      v-if="!selected && node.attrs.source"
      :source="node.attrs.source"
    />
    <textarea
      v-else
      :value="node.attrs.source"
      placeholder="Mermaid記法を入力"
      rows="6"
      @input="onInput"
    />
  </NodeViewWrapper>
</template>
