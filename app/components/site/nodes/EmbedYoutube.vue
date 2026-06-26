<script setup lang="ts">
const props = defineProps<{ url: string }>()

const videoId = computed(() => {
  try {
    const parsed = new URL(props.url)
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1)
    return parsed.searchParams.get('v') ?? ''
  } catch {
    return ''
  }
})
</script>

<template>
  <iframe
    v-if="videoId"
    :src="`https://www.youtube.com/embed/${videoId}`"
    allow="
      accelerometer;
      autoplay;
      clipboard-write;
      encrypted-media;
      gyroscope;
      picture-in-picture;
    "
    allowfullscreen
    width="560"
    height="315"
  />
  <a v-else :href="url" target="_blank" rel="noopener noreferrer">{{ url }}</a>
</template>
