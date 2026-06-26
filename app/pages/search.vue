<script setup lang="ts">
interface SearchResult {
  slug: string
  title: string
  snippet: string
  publishedAt: string
}

const route = useRoute()
const query = ref((route.query.q as string) ?? '')
const searchedQuery = ref(query.value)

const { data, refresh } = await useFetch<{
  results: SearchResult[]
  pagination: { totalCount: number }
}>('/api/search', {
  query: { q: searchedQuery },
  immediate: !!searchedQuery.value,
})

function onSubmit() {
  if (!query.value.trim()) return
  searchedQuery.value = query.value
  refresh()
}
</script>

<template>
  <div>
    <h1 class="mb-6 text-2xl font-bold dark:text-white">検索</h1>
    <form class="flex gap-2" @submit.prevent="onSubmit">
      <input
        v-model="query"
        type="search"
        placeholder="検索語を入力"
        class="flex-grow rounded-md border border-zinc-200 bg-white/70 px-3 py-2 text-sm backdrop-blur-sm dark:border-zinc-600 dark:bg-zinc-700/80 dark:text-zinc-100"
      />
      <button
        type="submit"
        class="rounded-md bg-odwr-300 px-4 py-2 text-sm font-bold text-zinc-900 transition hover:bg-odwr-200"
      >
        検索
      </button>
    </form>

    <div v-if="searchedQuery" class="mt-6">
      <p
        v-if="data && data.results.length === 0"
        class="text-zinc-600 dark:text-zinc-300"
      >
        一致する記事が見つかりませんでした
      </p>
      <ul v-else-if="data" class="flex flex-col gap-6">
        <li
          v-for="result in data.results"
          :key="result.slug"
          class="rounded-lg border border-zinc-200 bg-white/70 px-7 py-7 backdrop-blur-sm dark:border-zinc-600 dark:bg-zinc-700/80"
        >
          <NuxtLink
            :to="`/posts/${result.slug}`"
            class="text-xl font-bold hover:underline dark:text-zinc-100"
            >{{ result.title }}</NuxtLink
          >
          <div class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            <time :datetime="result.publishedAt">{{ result.publishedAt }}</time>
          </div>
          <p
            class="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
          >
            <template
              v-for="(part, i) in parseSnippet(result.snippet)"
              :key="i"
            >
              <mark
                v-if="part.highlighted"
                class="bg-odwr-200 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-100"
                >{{ part.text }}</mark
              >
              <template v-else>{{ part.text }}</template>
            </template>
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>
