<script setup lang="ts">
import type { FootnoteItem } from '#shared/types/article'

defineProps<{ items: FootnoteItem[] }>()
</script>

<template>
  <section
    v-if="items.length"
    aria-label="脚注"
    class="mt-8 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-700"
  >
    <ol class="mt-2 space-y-1">
      <li
        v-for="item in items"
        :id="`footnote-${item.number}`"
        :key="item.number"
        class="text-zinc-600 dark:text-zinc-300"
      >
        [{{ item.number }}] {{ item.content }}
        <a
          :href="`#footnote-ref-${item.number}`"
          class="text-zinc-500 hover:underline dark:text-zinc-400"
          >↩</a
        >
      </li>
    </ol>
  </section>
</template>
