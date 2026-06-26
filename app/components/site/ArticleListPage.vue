<script setup lang="ts">
const props = defineProps<{ page: number }>()
const { data, error } = await useArticleList(props.page)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: 'Failed to load articles',
  })
}
</script>

<template>
  <div v-if="data" class="flex flex-col gap-6">
    <SitePostCard
      v-for="article in data.articles"
      :key="article.slug"
      :article="article"
    />
    <p
      v-if="data.articles.length === 0"
      class="text-zinc-600 dark:text-zinc-300"
    >
      記事がまだありません。
    </p>
    <SitePagination
      :page="data.pagination.page"
      :total-pages="data.pagination.totalPages"
    />
  </div>
</template>
