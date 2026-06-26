<script setup lang="ts">
import type { ArticleSummary, Pagination } from '#shared/types/article'
import { SITE_DESCRIPTION } from '#shared/constants'

const route = useRoute()
const slug = route.params.slug as string

const { data, error } = await useFetch<{
  tag: { name: string; slug: string }
  articles: ArticleSummary[]
  pagination: Pagination
}>(`/api/tags/${slug}/articles`)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: 'Tag not found',
  })
}

useHead(() => ({
  title: data.value ? `タグ: ${data.value.tag.name}` : '',
  meta: [
    {
      name: 'description',
      content: data.value
        ? `「${data.value.tag.name}」タグが付いた記事の一覧です。`
        : SITE_DESCRIPTION,
    },
  ],
}))
</script>

<template>
  <div v-if="data">
    <h1 class="mb-6 text-2xl font-bold dark:text-white">
      タグ: {{ data.tag.name }}
    </h1>
    <div class="flex flex-col gap-6">
      <SitePostCard
        v-for="article in data.articles"
        :key="article.slug"
        :article="article"
      />
      <p
        v-if="data.articles.length === 0"
        class="text-zinc-600 dark:text-zinc-300"
      >
        このタグの記事はまだありません。
      </p>
    </div>
  </div>
</template>
