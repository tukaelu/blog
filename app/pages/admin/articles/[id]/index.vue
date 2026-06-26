<script setup lang="ts">
import type { AdminArticleDetail } from '#shared/types/article'

// 記事編集はArticleForm自体が閉じるボタン付きの専用ヘッダーを持つため、
// 執筆に集中できるよう管理画面共通のナビゲーションヘッダーは表示しない。
definePageMeta({ layout: false })

const route = useRoute()
const { data: article, error } = await useFetch<AdminArticleDetail>(
  `/api/admin/articles/${route.params.id}`
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: 'Article not found',
  })
}
</script>

<template>
  <AdminArticleForm v-if="article" :initial="article" />
</template>
