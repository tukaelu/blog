<script setup lang="ts">
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

function onInput(e: Event) {
  props.updateAttributes({ url: (e.target as HTMLInputElement).value })
}
</script>

<template>
  <NodeViewWrapper data-type="embed">
    <SiteNodesEmbed
      v-if="!selected && node.attrs.url"
      :provider="node.attrs.provider"
      :url="node.attrs.url"
    />
    <template v-else>
      <span>{{ node.attrs.provider }}埋め込み:</span>
      <input :value="node.attrs.url" placeholder="URL" @input="onInput" />
    </template>
  </NodeViewWrapper>
</template>
