<script setup lang="ts">
const props = defineProps<{
  code: string
  language: string | null
  filepath: string | null
}>()
const html = await highlightCode(props.code, props.language)
</script>

<template>
  <figure>
    <figcaption v-if="filepath">{{ filepath }}</figcaption>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-html="html" />
  </figure>
</template>
