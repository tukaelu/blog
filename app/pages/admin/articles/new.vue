<script setup lang="ts">
// 記事編集はArticleForm自体が閉じるボタン付きの専用ヘッダーを持つため、
// 執筆に集中できるよう管理画面共通のナビゲーションヘッダーは表示しない。
definePageMeta({ layout: false })
</script>

<template>
  <AdminArticleForm :initial="null" />
</template>
