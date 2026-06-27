<script setup lang="ts">
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'
import { WorkflowIcon } from '@lucide/vue'
import NodeEditRow from './NodeEditRow.vue'

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
    <div v-else class="flex flex-col gap-2">
      <NodeEditRow :icon="WorkflowIcon" @delete="deleteNode">
        <span class="flex-1 text-sm text-muted-foreground">Mermaid図表</span>
      </NodeEditRow>
      <textarea
        :value="node.attrs.source"
        placeholder="Mermaid記法を入力"
        rows="6"
        class="w-full"
        @input="onInput"
      />
    </div>
  </NodeViewWrapper>
</template>
