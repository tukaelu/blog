<script setup lang="ts">
declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } }
  }
}

const props = defineProps<{ url: string }>()

onMounted(() => {
  if (window.instgrm) {
    window.instgrm.Embeds.process()
    return
  }
  const script = document.createElement('script')
  script.src = 'https://www.instagram.com/embed.js'
  script.async = true
  document.body.appendChild(script)
})
</script>

<template>
  <blockquote class="instagram-media" :data-instgrm-permalink="url">
    <a :href="url" target="_blank" rel="noopener noreferrer">{{ url }}</a>
  </blockquote>
</template>
