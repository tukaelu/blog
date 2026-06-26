<script setup lang="ts">
import type { TocItem } from '#shared/types/tiptap-nodes'

defineProps<{ items: TocItem[] }>()
</script>

<template>
  <nav v-if="items.length" aria-label="目次" class="px-4 py-3">
    <p class="mb-2 text-sm font-bold text-zinc-700 dark:text-zinc-200">目次</p>
    <ol class="space-y-1.5">
      <li
        v-for="item in items"
        :key="item.anchor"
        :style="{ marginLeft: `${(item.level - 2) * 1}em` }"
      >
        <a
          :href="`#${item.anchor}`"
          class="block py-0.5 text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >{{ item.text }}</a
        >
      </li>
    </ol>
  </nav>
</template>
