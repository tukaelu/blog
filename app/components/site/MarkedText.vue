<script setup lang="ts">
import type { TiptapMark } from '#shared/types/tiptap-nodes'

const props = defineProps<{ text: string; marks: TiptapMark[] }>()
const [mark, ...rest] = props.marks
</script>

<template>
  <template v-if="!mark">{{ text }}</template>
  <strong v-else-if="mark.type === 'bold'"
    ><SiteMarkedText :text="text" :marks="rest"
  /></strong>
  <em v-else-if="mark.type === 'italic'"
    ><SiteMarkedText :text="text" :marks="rest"
  /></em>
  <code v-else-if="mark.type === 'code'"
    ><SiteMarkedText :text="text" :marks="rest"
  /></code>
  <a
    v-else-if="mark.type === 'link'"
    :href="String(mark.attrs?.href ?? '')"
    target="_blank"
    rel="noopener noreferrer"
  >
    <SiteMarkedText :text="text" :marks="rest" />
  </a>
  <SiteMarkedText v-else :text="text" :marks="rest" />
</template>
