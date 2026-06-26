<script setup lang="ts">
declare global {
  interface Window {
    twttr?: { widgets: { load: (el?: HTMLElement) => void } }
  }
}

const props = defineProps<{ url: string }>()
const container = ref<HTMLElement>()

onMounted(() => {
  if (window.twttr) {
    window.twttr.widgets.load(container.value)
    return
  }
  const script = document.createElement('script')
  script.src = 'https://platform.twitter.com/widgets.js'
  script.async = true
  script.onload = () => window.twttr?.widgets.load(container.value)
  document.body.appendChild(script)
})
</script>

<template>
  <div ref="container">
    <blockquote class="twitter-tweet">
      <a :href="url" target="_blank" rel="noopener noreferrer">{{ url }}</a>
    </blockquote>
  </div>
</template>
