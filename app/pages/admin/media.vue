<script setup lang="ts">
import { FileTextIcon } from '@lucide/vue'

interface MediaItem {
  id: string
  url: string
  mimeType: string
  width: number | null
  height: number | null
  createdAt: string
}

// 記事一覧ページと同じ構造の全幅ヘッダー（アイコンのみ、罫線なし）に統一する
definePageMeta({ layout: false })

const { data, refresh } = await useFetch<{ media: MediaItem[] }>(
  '/api/admin/media',
  { query: { limit: 100 } }
)
const uploading = ref(false)
const errorMessage = ref('')

async function uploadFile(file: File) {
  uploading.value = true
  errorMessage.value = ''
  const formData = new FormData()
  formData.append('file', file)
  try {
    await $fetch('/api/admin/media', { method: 'POST', body: formData })
    await refresh()
  } catch {
    errorMessage.value = 'アップロードに失敗しました。再度お試しください'
  } finally {
    uploading.value = false
  }
}

function onFileInputChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) uploadFile(file)
}

function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file) uploadFile(file)
}

async function remove(id: string) {
  if (
    !confirm(
      'この画像を削除しますか？記事内で使用中の場合、表示できなくなります。'
    )
  )
    return
  await $fetch(`/api/admin/media/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div>
    <header
      class="sticky top-0 z-10 flex items-center justify-end gap-1 bg-background/90 px-4 py-3 backdrop-blur"
    >
      <Button as-child variant="ghost" size="icon-sm" title="記事一覧">
        <NuxtLink to="/admin/articles"
          ><FileTextIcon class="size-4"
        /></NuxtLink>
      </Button>
      <SiteThemeToggle />
    </header>

    <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 pt-4 pb-10">
      <h1 class="text-2xl font-bold">メディアライブラリ</h1>

      <Card>
        <CardContent class="flex flex-col gap-3">
          <div class="flex flex-col gap-1.5">
            <Label>アップロード</Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              @change="onFileInputChange"
            />
          </div>
          <div
            class="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground"
            @dragover.prevent
            @drop.prevent="onDrop"
          >
            ここに画像をドラッグ&ドロップ
          </div>
          <p v-if="uploading" class="text-sm text-muted-foreground">
            アップロード中…
          </p>
          <p v-if="errorMessage" class="text-sm text-destructive">
            {{ errorMessage }}
          </p>
        </CardContent>
      </Card>

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        <Card v-for="item in data?.media ?? []" :key="item.id" class="gap-2">
          <CardContent class="flex flex-col gap-2">
            <img
              :src="item.url"
              :alt="item.id"
              class="aspect-square rounded-md object-cover"
            />
            <span class="text-xs text-muted-foreground"
              >{{ item.width }}x{{ item.height }}</span
            >
            <span class="text-xs text-muted-foreground">{{
              item.createdAt
            }}</span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              @click="remove(item.id)"
              >削除</Button
            >
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
