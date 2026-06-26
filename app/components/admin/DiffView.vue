<script setup lang="ts">
import type { DiffPart } from '#shared/types/article'

defineProps<{ parts: DiffPart[] }>()
</script>

<template>
  <span>
    <template v-for="(part, i) in parts" :key="i">
      <ins
        v-if="part.type === 'added'"
        class="bg-green-100 text-green-800 no-underline dark:bg-green-900/40 dark:text-green-300"
        >{{ part.value }}</ins
      >
      <del
        v-else-if="part.type === 'removed'"
        class="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
        >{{ part.value }}</del
      >
      <template v-else>{{ part.value }}</template>
    </template>
  </span>
</template>
