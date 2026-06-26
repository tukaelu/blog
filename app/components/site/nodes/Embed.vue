<script setup lang="ts">
defineProps<{ provider: string; url: string }>()
</script>

<template>
  <SiteNodesEmbedYoutube v-if="provider === 'youtube'" :url="url" />
  <!-- X/Instagramは外部ウィジェットスクリプトがDOM操作するためクライアント専用 -->
  <ClientOnly v-else-if="provider === 'x'">
    <SiteNodesEmbedX :url="url" />
  </ClientOnly>
  <ClientOnly v-else-if="provider === 'instagram'">
    <SiteNodesEmbedInstagram :url="url" />
  </ClientOnly>
  <!-- GitHubはリポジトリ/gistのOGPカードで代用する -->
  <SiteNodesLinkCard v-else-if="provider === 'github'" :url="url" />
  <a v-else :href="url" target="_blank" rel="noopener noreferrer">{{ url }}</a>
</template>
