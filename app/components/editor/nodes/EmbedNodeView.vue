<script setup lang="ts">
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'
import { embedProviders } from './embed-providers'
import NodeEditRow from './NodeEditRow.vue'

const props = defineProps<NodeViewProps>()

const providerInfo = computed(() =>
  embedProviders.find(p => p.provider === props.node.attrs.provider)
)

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
    <NodeEditRow v-else :icon="providerInfo?.icon" @delete="deleteNode">
      <input
        :value="node.attrs.url"
        :placeholder="providerInfo ? `${providerInfo.label}のURL` : 'URL'"
        class="w-full"
        @input="onInput"
      />
    </NodeEditRow>
  </NodeViewWrapper>
</template>
