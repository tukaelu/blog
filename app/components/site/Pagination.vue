<script setup lang="ts">
const props = defineProps<{ page: number; totalPages: number }>()

function hrefFor(page: number) {
  return page <= 1 ? '/' : `/page/${page}`
}
</script>

<template>
  <nav
    v-if="totalPages > 1"
    aria-label="ページネーション"
    class="mt-4 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300"
  >
    <NuxtLink
      v-if="page > 1"
      :to="hrefFor(page - 1)"
      class="hover:text-zinc-900 hover:underline dark:hover:text-zinc-100"
      >← 前へ</NuxtLink
    >
    <span v-else />
    <span>{{ page }} / {{ totalPages }}</span>
    <NuxtLink
      v-if="page < totalPages"
      :to="hrefFor(page + 1)"
      class="hover:text-zinc-900 hover:underline dark:hover:text-zinc-100"
      >次へ →</NuxtLink
    >
    <span v-else />
  </nav>
</template>
