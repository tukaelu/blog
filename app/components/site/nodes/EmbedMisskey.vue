<script setup lang="ts">
const props = defineProps<{ url: string }>()

const embedSrc = computed(() => {
  try {
    const parsed = new URL(props.url)
    const match = parsed.pathname.match(/^\/notes\/([\w-]+)/)
    if (!match) return ''
    return `${parsed.origin}/embed/notes/${match[1]}`
  } catch {
    return ''
  }
})
</script>

<template>
  <iframe
    v-if="embedSrc"
    :src="embedSrc"
    width="500"
    height="300"
    style="border: none"
  />
  <a v-else :href="url" target="_blank" rel="noopener noreferrer">{{ url }}</a>
</template>
