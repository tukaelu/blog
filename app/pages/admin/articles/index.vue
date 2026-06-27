<script setup lang="ts">
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  CircleCheckBigIcon,
  ClockIcon,
  ImageIcon,
  MoreVerticalIcon,
  PencilLineIcon,
  SearchIcon,
  SquarePenIcon,
} from '@lucide/vue'
import type {
  AdminArticleDetail,
  AdminArticleSummary,
  Pagination,
} from '#shared/types/article'
import type { DisplayStatus } from '~/utils/article-status'

// ArticleForm自体が閉じるボタン付きの専用ヘッダーを持つ編集画面と合わせ、
// 一覧も共通ナビゲーションヘッダーを持たず、ページ自身の見出し行にアイコンを添える構成にする。
definePageMeta({ layout: false })

const filter = ref<'all' | DisplayStatus>('all')
const search = ref('')
const sortOrder = ref<'updatedDesc' | 'publishedDesc'>('updatedDesc')
const page = ref(1)
const pageSize = ref(10)

const statusIcon: Record<DisplayStatus, unknown> = {
  下書き: PencilLineIcon,
  予約中: ClockIcon,
  公開済み: CircleCheckBigIcon,
}

const { data, refresh } = await useFetch<{
  articles: AdminArticleSummary[]
  pagination: Pagination
}>('/api/admin/articles', { query: { status: 'all', limit: 1000 } })

const articles = computed(() => data.value?.articles ?? [])

// フィルタボタンに添える件数はフィルタ・検索の影響を受けない全件ベースで出す
const statusCounts = computed(() => {
  const counts: Record<DisplayStatus, number> = {
    下書き: 0,
    予約中: 0,
    公開済み: 0,
  }
  for (const article of articles.value) {
    counts[computeDisplayStatus(article.status, article.publishedAt)]++
  }
  return counts
})

const filteredArticles = computed(() => {
  let list = articles.value
  if (filter.value !== 'all') {
    list = list.filter(
      a => computeDisplayStatus(a.status, a.publishedAt) === filter.value
    )
  }
  const query = search.value.trim().toLowerCase()
  if (query) {
    list = list.filter(
      a =>
        a.title.toLowerCase().includes(query) ||
        a.slug.toLowerCase().includes(query) ||
        a.id.toLowerCase().includes(query)
    )
  }
  return [...list].sort((a, b) =>
    sortOrder.value === 'publishedDesc'
      ? (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')
      : b.updatedAt.localeCompare(a.updatedAt)
  )
})

const pageCount = computed(() =>
  Math.max(1, Math.ceil(filteredArticles.value.length / pageSize.value))
)
// フィルタ・検索・ページサイズの変更でページ数が減った場合、範囲外に留まらないよう補正する
watch([filteredArticles, pageSize], () => {
  if (page.value > pageCount.value) page.value = pageCount.value
})
const visibleArticles = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredArticles.value.slice(start, start + pageSize.value)
})

async function remove(id: string) {
  if (!confirm('この記事を削除しますか？')) return
  await $fetch(`/api/admin/articles/${id}`, { method: 'DELETE' })
  await refresh()
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return iso.slice(0, 10)
}

async function setDraft(article: AdminArticleSummary) {
  const detail = await $fetch<AdminArticleDetail>(
    `/api/admin/articles/${article.id}`
  )
  await $fetch(`/api/admin/articles/${article.id}`, {
    method: 'PUT',
    body: {
      title: detail.title,
      slug: detail.slug,
      bodyJson: detail.bodyJson,
      description: detail.description,
      tagNames: detail.tagNames,
      status: 'draft',
      publishedAt: detail.publishedAt,
      coverImageId: detail.coverImageId,
    },
  })
  await refresh()
}
</script>

<template>
  <div>
    <header
      class="sticky top-0 z-10 flex items-center justify-end gap-1 bg-background/90 px-4 py-3 backdrop-blur"
    >
      <SiteThemeToggle />
    </header>

    <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 pt-4 pb-10">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">記事一覧</h1>
        <div class="flex items-center gap-2">
          <Button as-child variant="outline">
            <NuxtLink to="/admin/media"
              ><ImageIcon class="size-4" />メディア</NuxtLink
            >
          </Button>
          <Button as-child>
            <NuxtLink to="/admin/articles/new"
              ><SquarePenIcon class="size-4" />書く</NuxtLink
            >
          </Button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="relative w-64">
          <SearchIcon
            class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            v-model="search"
            placeholder="タイトル・IDで検索"
            class="pl-8"
            @update:model-value="page = 1"
          />
        </div>
        <ToggleGroup
          v-model="filter"
          type="single"
          variant="outline"
          @update:model-value="page = 1"
        >
          <ToggleGroupItem value="all">すべて</ToggleGroupItem>
          <ToggleGroupItem value="下書き"
            >下書き（{{ statusCounts.下書き }}）</ToggleGroupItem
          >
          <ToggleGroupItem value="予約中"
            >予約中（{{ statusCounts.予約中 }}）</ToggleGroupItem
          >
          <ToggleGroupItem value="公開済み"
            >公開済み（{{ statusCounts.公開済み }}）</ToggleGroupItem
          >
        </ToggleGroup>
        <Select v-model="sortOrder">
          <SelectTrigger class="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updatedDesc">更新が新しい順</SelectItem>
            <SelectItem value="publishedDesc">公開が新しい順</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p v-if="filteredArticles.length === 0" class="text-muted-foreground">
        記事がありません。「新規作成」から最初の記事を書いてみましょう。
      </p>
      <template v-else>
        <div class="overflow-hidden rounded-lg border">
          <Table class="table-fixed">
            <TableHeader>
              <TableRow class="bg-muted/50 hover:bg-muted/50">
                <TableHead>タイトル</TableHead>
                <TableHead class="w-28">ステータス</TableHead>
                <TableHead class="w-20 text-right">文字数</TableHead>
                <TableHead class="w-20 text-right">いいね</TableHead>
                <TableHead class="w-24">公開日</TableHead>
                <TableHead class="w-24">更新日</TableHead>
                <TableHead class="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="article in visibleArticles" :key="article.id">
                <TableCell class="font-medium">
                  <div class="flex flex-col gap-1">
                    <NuxtLink
                      :to="`/admin/articles/${article.id}`"
                      class="block truncate hover:underline"
                      >{{ article.title || '無題の記事' }}</NuxtLink
                    >
                    <div
                      v-if="article.tags.length"
                      class="flex flex-wrap gap-1"
                    >
                      <Badge
                        v-for="tag in article.tags"
                        :key="tag"
                        variant="secondary"
                        class="h-4 px-1.5 text-[10px] font-normal"
                        >#{{ tag }}</Badge
                      >
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" class="gap-1 font-normal">
                    <component
                      :is="
                        statusIcon[
                          computeDisplayStatus(
                            article.status,
                            article.publishedAt
                          )
                        ]
                      "
                      class="size-3"
                    />
                    {{
                      computeDisplayStatus(article.status, article.publishedAt)
                    }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right text-xs text-muted-foreground">{{
                  article.characterCount.toLocaleString()
                }}</TableCell>
                <TableCell class="text-right text-xs text-muted-foreground">{{
                  article.likeCount.toLocaleString()
                }}</TableCell>
                <TableCell class="text-xs text-muted-foreground">{{
                  formatDate(article.publishedAt)
                }}</TableCell>
                <TableCell class="text-xs text-muted-foreground">{{
                  formatDate(article.updatedAt)
                }}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon-sm" title="操作">
                        <MoreVerticalIcon class="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        v-if="article.status === 'published'"
                        @click="setDraft(article)"
                        >下書きにする</DropdownMenuItem
                      >
                      <DropdownMenuItem
                        variant="destructive"
                        @click="remove(article.id)"
                        >削除</DropdownMenuItem
                      >
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-sm text-muted-foreground">
            {{ filteredArticles.length }}件中
            {{ visibleArticles.length }}件を表示
          </p>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted-foreground">表示件数</span>
              <Select v-model="pageSize">
                <SelectTrigger class="w-18">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="10">10</SelectItem>
                  <SelectItem :value="20">20</SelectItem>
                  <SelectItem :value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span class="text-sm text-muted-foreground"
              >{{ page }} / {{ pageCount }} ページ</span
            >
            <div class="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                :disabled="page <= 1"
                @click="page = 1"
              >
                <ChevronsLeftIcon class="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                :disabled="page <= 1"
                @click="page--"
              >
                <ChevronLeftIcon class="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                :disabled="page >= pageCount"
                @click="page++"
              >
                <ChevronRightIcon class="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                :disabled="page >= pageCount"
                @click="page = pageCount"
              >
                <ChevronsRightIcon class="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
