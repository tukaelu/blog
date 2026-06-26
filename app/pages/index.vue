<script setup lang="ts">
import { SITE_DESCRIPTION } from '#shared/constants'

useHead({
  meta: [{ name: 'description', content: SITE_DESCRIPTION }],
})
</script>

<template>
  <SiteArticleListPage :page="1" />
</template>
