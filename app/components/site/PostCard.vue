<script setup lang="ts">
import type { ArticleSummary } from '#shared/types/article'

const props = defineProps<{ article: ArticleSummary }>()
const formattedDate = computed(() =>
  new Date(props.article.publishedAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
)
</script>

<template>
  <article
    class="rounded-lg border border-zinc-200 bg-white/70 px-7 py-7 backdrop-blur-sm dark:border-zinc-600 dark:bg-zinc-700/80"
  >
    <NuxtLink :to="`/posts/${article.slug}`" class="group block">
      <img
        v-if="article.coverImageUrl"
        :src="article.coverImageUrl"
        :alt="article.title"
        class="mb-3 w-full rounded-md object-cover"
      />
      <h2
        class="text-xl leading-snug font-bold group-hover:underline dark:text-zinc-100"
      >
        {{ article.title }}
      </h2>
    </NuxtLink>
    <div
      class="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-gray-500 dark:text-zinc-400"
    >
      <time :datetime="article.publishedAt">{{ formattedDate }}</time>
      <span aria-hidden="true">・</span>
      <span>{{ article.readingTimeMinutes }}分で読めます</span>
    </div>
    <div v-if="article.tags.length" class="mt-3 flex flex-wrap gap-2">
      <NuxtLink
        v-for="tag in article.tags"
        :key="tag.slug"
        :to="`/tags/${tag.slug}`"
        class="rounded-full bg-odwr-200/50 px-3 py-1 text-xs font-bold text-zinc-700 dark:bg-zinc-600 dark:text-zinc-200"
        >{{ tag.name }}</NuxtLink
      >
    </div>
    <p
      v-if="article.description"
      class="mt-3 line-clamp-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
    >
      {{ article.description }}
    </p>
    <NuxtLink
      :to="`/posts/${article.slug}`"
      class="mt-3 inline-block text-sm font-bold text-zinc-800 hover:underline dark:text-zinc-200"
      >続きを読む →</NuxtLink
    >
  </article>
</template>
