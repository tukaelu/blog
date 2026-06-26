<script setup lang="ts">
const props = defineProps<{ source: string }>()
const svg = ref('')

onMounted(async () => {
  const { default: mermaid } = await import('mermaid')
  mermaid.initialize({ startOnLoad: false })
  const id = `mermaid-${Math.random().toString(36).slice(2)}`
  try {
    const result = await mermaid.render(id, props.source)
    svg.value = result.svg
  } catch {
    svg.value = ''
  }
})
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div v-if="svg" v-html="svg" />
  <pre v-else>{{ source }}</pre>
</template>
