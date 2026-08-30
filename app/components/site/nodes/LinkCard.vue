<script setup lang="ts">
import type { OgpResult } from '~~/server/api/og-fetch.get'

// awaitしない：この非同期setupを管理画面エディターのNodeView（Tiptapの
// VueRenderer配下、Suspense境界の外）から使うと "async setup requires Suspense"
// で描画されなくなるため、素のリンク表示→OGP取得後にリッチカードへ差し替える形にする
const props = defineProps<{ url: string }>()
const { data: ogp } = useFetch<OgpResult | null>('/api/og-fetch', {
  query: { url: props.url },
})
</script>

<template>
  <a v-if="ogp" :href="url" target="_blank" rel="noopener noreferrer">
    <div>
      <span>{{ ogp.title }}</span>
      <span>{{ ogp.description }}</span>
      <span>{{ ogp.host }}</span>
    </div>
    <img v-if="ogp.image" :src="ogp.image" :alt="ogp.title" />
  </a>
  <a v-else :href="url" target="_blank" rel="noopener noreferrer">{{ url }}</a>
</template>
