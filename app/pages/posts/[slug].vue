<script setup lang="ts">
import type { ArticleDetail } from '#shared/types/article'
import { SITE_DESCRIPTION } from '#shared/constants'

// Vue Routerは同一ルートレコードへの遷移（記事本文中のリンクで別記事へ移動する等）で
// コンポーネントインスタンスを再利用するため、keyでslugごとに再マウントさせる。
// これが無いと本文・TOC・いいね状態が前の記事のまま残ってしまう。
definePageMeta({
  key: route => route.fullPath,
})

const route = useRoute()
const slug = route.params.slug as string

const { data: article, error } = await useFetch<ArticleDetail>(
  `/api/articles/${slug}`
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: 'Article not found',
  })
}

const formattedDate = computed(() =>
  article.value
    ? new Date(article.value.publishedAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : ''
)

// 旧Astroサイトのdescriptionは全記事必須だったが、descriptionを持たない記事も
// 存在しうる（server/utils/article-input.ts）ため、サイト全体の説明文にフォールバックする
const metaDescription = computed(
  () => article.value?.description || SITE_DESCRIPTION
)

useHead(() => ({
  title: article.value?.title,
  meta: [
    { name: 'description', content: metaDescription.value },
    { property: 'og:type', content: 'article' },
    { property: 'og:title', content: article.value?.title },
    { property: 'og:description', content: metaDescription.value },
  ],
}))

defineOgImageComponent('BlogPost', {
  title: computed(() => article.value?.title ?? ''),
})

// 本文中の脚注参照(Footnote.vue)へ出現順の連番を割り振るための共有カウンター。
// 同一contentの脚注が複数箇所にあってもcontent文字列ではなく出現順で区別する。
provide('footnoteCounter', { current: 0 })

const { likeCount, liked, pending, rateLimited, failed, like } = useLike(
  article.value?.id ?? '',
  article.value?.likeCount ?? 0
)
</script>

<template>
  <article v-if="article">
    <header class="flex flex-col items-center">
      <time
        :datetime="article.publishedAt"
        class="mt-2 text-lg dark:text-white sm:text-xl"
        >{{ formattedDate }}</time
      >
      <h1
        class="mt-2 text-center text-2xl font-bold tracking-tight sm:mt-4 sm:text-3xl dark:text-white"
      >
        {{ article.title }}
      </h1>
      <span class="mt-1 text-sm text-zinc-500 dark:text-zinc-400"
        >{{ article.readingTimeMinutes }}分で読めます</span
      >
      <div
        v-if="article.tags.length"
        class="mt-3 flex flex-wrap justify-center gap-2"
      >
        <NuxtLink
          v-for="tag in article.tags"
          :key="tag.slug"
          :to="`/tags/${tag.slug}`"
          class="rounded-full bg-odwr-200 px-2 py-1 text-xs font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
          >{{ tag.name }}</NuxtLink
        >
      </div>
    </header>

    <div
      v-if="article.toc.length"
      class="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-white/70 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-700/80"
    >
      <SiteTableOfContents :items="article.toc" />
    </div>

    <div class="prose mt-8 max-w-full dark:prose-invert dark:text-zinc-300">
      <SiteNodeRenderer :node="article.bodyJson" />
    </div>
    <SiteFootnoteList :items="article.footnotes" />

    <div class="mt-6 flex flex-col items-start gap-2">
      <button
        type="button"
        :disabled="pending || liked"
        :aria-pressed="liked"
        class="rounded-full border border-zinc-200 px-4 py-2 text-sm transition hover:bg-odwr-200/50 disabled:opacity-70 dark:border-zinc-600 dark:hover:bg-zinc-700"
        @click="like"
      >
        {{ liked ? '❤ いいね済み' : '🤍 いいね' }} {{ likeCount }}
      </button>
      <span v-if="rateLimited" class="text-sm text-zinc-500 dark:text-zinc-400"
        >しばらくしてからもう一度お試しください</span
      >
      <span v-if="failed" class="text-sm text-zinc-500 dark:text-zinc-400"
        >いいねに失敗しました。もう一度お試しください</span
      >
    </div>
  </article>
</template>
