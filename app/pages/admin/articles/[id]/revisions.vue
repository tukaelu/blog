<script setup lang="ts">
import type { RevisionSummary, RevisionDiff } from '#shared/types/article'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const articleId = route.params.id as string

const { data: revisionsData } = await useFetch<{
  revisions: RevisionSummary[]
}>(`/api/admin/articles/${articleId}/revisions`)

const selectedRevisionId = ref(revisionsData.value?.revisions[0]?.id ?? '')
const against = ref<'previous' | 'current' | string>('previous')

const { data: diffData, refresh: refreshDiff } = await useFetch<RevisionDiff>(
  () =>
    `/api/admin/articles/${articleId}/revisions/${selectedRevisionId.value}/diff`,
  { query: { against }, immediate: !!selectedRevisionId.value }
)

watch([selectedRevisionId, against], () => {
  if (selectedRevisionId.value) refreshDiff()
})

async function revert(revisionId: string) {
  if (
    !confirm(
      '現在の内容を上書きし、新しいリビジョンとして記録します。よろしいですか？'
    )
  )
    return
  await $fetch(
    `/api/admin/articles/${articleId}/revisions/${revisionId}/revert`,
    { method: 'POST' }
  )
  await navigateTo(`/admin/articles/${articleId}`)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">リビジョン履歴</h1>
      <Button as-child variant="outline">
        <NuxtLink :to="`/admin/articles/${articleId}`">記事編集に戻る</NuxtLink>
      </Button>
    </div>

    <div class="flex flex-col gap-2">
      <Card
        v-for="rev in revisionsData?.revisions ?? []"
        :key="rev.id"
        class="cursor-pointer"
        :class="selectedRevisionId === rev.id && 'ring-2 ring-primary'"
        @click="selectedRevisionId = rev.id"
      >
        <CardContent class="flex items-center justify-between gap-2">
          <span
            >#{{ rev.revisionNo }} {{ rev.title }}（{{ rev.createdAt }}）</span
          >
          <Button
            type="button"
            variant="outline"
            size="sm"
            @click.stop="revert(rev.id)"
          >
            このバージョンに戻す
          </Button>
        </CardContent>
      </Card>
    </div>

    <div v-if="selectedRevisionId" class="flex flex-col gap-4">
      <div class="flex items-center gap-2">
        <Label>比較対象</Label>
        <Select v-model="against">
          <SelectTrigger class="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="previous">直前のリビジョン</SelectItem>
            <SelectItem value="current">現在の内容</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card v-if="diffData">
        <CardContent class="flex flex-col gap-4">
          <div>
            <h2 class="mb-1 text-sm font-bold text-muted-foreground">
              タイトル
            </h2>
            <AdminDiffView :parts="diffData.titleDiff" />
          </div>
          <div>
            <h2 class="mb-1 text-sm font-bold text-muted-foreground">概要文</h2>
            <AdminDiffView :parts="diffData.descriptionDiff" />
          </div>
          <div>
            <h2 class="mb-1 text-sm font-bold text-muted-foreground">本文</h2>
            <pre
              class="text-wrap"
            ><AdminDiffView :parts="diffData.bodyDiff" /></pre>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
