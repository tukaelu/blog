<script setup lang="ts">
defineProps<{ content: string }>()
const counter = inject<{ current: number }>('footnoteCounter')
const number = counter ? ++counter.current : 0
</script>

<template>
  <sup :id="`footnote-ref-${number}`">
    <a :href="`#footnote-${number}`">[{{ number }}]</a>
  </sup>
</template>
