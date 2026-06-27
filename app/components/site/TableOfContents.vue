<script setup lang="ts">
import type { TocItem } from '#shared/types/tiptap-nodes'

const props = defineProps<{ items: TocItem[] }>()

// 見出しの表示範囲に応じてTOCの該当項目をハイライトする（旧Astroサイトと同じ挙動）。
const activeAnchor = ref<string | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  const headingEls = props.items
    .map(item => document.getElementById(item.anchor))
    .filter((el): el is HTMLElement => el !== null)
  if (!headingEls.length) return

  const visible = new Set<string>()
  observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.id)
        else visible.delete(entry.target.id)
      }
      activeAnchor.value =
        props.items.find(item => visible.has(item.anchor))?.anchor ?? null
    },
    { rootMargin: '-80px 0% -60% 0%', threshold: 0 }
  )
  headingEls.forEach(el => observer!.observe(el))
})

onUnmounted(() => observer?.disconnect())
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
          class="block py-0.5 text-sm transition-colors"
          :class="
            item.anchor === activeAnchor
              ? 'font-semibold text-zinc-900 dark:text-zinc-50'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100'
          "
          >{{ item.text }}</a
        >
      </li>
    </ol>
  </nav>
</template>
