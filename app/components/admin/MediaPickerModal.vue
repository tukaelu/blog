<script setup lang="ts">
interface MediaItem {
  id: string
  url: string
  mimeType: string
  width: number | null
  height: number | null
  createdAt: string
}

const emit = defineEmits<{ select: [item: { id: string; url: string }] }>()

const isOpen = ref(false)
const tab = ref<'library' | 'upload'>('library')
const uploading = ref(false)

// immediate: false かつ open() 時にrefresh()するため、top-level awaitにしない
// （非同期setupになるとdefineExposeしたopen()がテンプレートrefから即座に呼べなくなるため）。
const { data, refresh } = useFetch<{ media: MediaItem[] }>('/api/admin/media', {
  query: { limit: 100 },
  immediate: false,
})

function open() {
  tab.value = 'library'
  refresh()
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function pick(item: MediaItem) {
  emit('select', { id: item.id, url: item.url })
  close()
}

async function onFileInputChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const uploaded = await $fetch<{ id: string; url: string }>(
      '/api/admin/media',
      { method: 'POST', body: formData }
    )
    emit('select', { id: uploaded.id, url: uploaded.url })
    close()
  } finally {
    uploading.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-lg sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>メディアを選択</DialogTitle>
        <DialogDescription
          >記事に挿入する画像をライブラリから選ぶか、新規にアップロードします。</DialogDescription
        >
      </DialogHeader>

      <Tabs v-model="tab">
        <TabsList>
          <TabsTrigger value="library">ライブラリから選択</TabsTrigger>
          <TabsTrigger value="upload">新規アップロード</TabsTrigger>
        </TabsList>

        <TabsContent value="library">
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="item in data?.media ?? []"
              :key="item.id"
              type="button"
              class="overflow-hidden rounded-md ring-1 ring-border transition hover:ring-primary"
              @click="pick(item)"
            >
              <img
                :src="item.url"
                :alt="item.id"
                class="aspect-square object-cover"
              />
            </button>
          </div>
        </TabsContent>

        <TabsContent value="upload" class="flex flex-col gap-2">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            @change="onFileInputChange"
          />
          <p v-if="uploading" class="text-sm text-muted-foreground">
            アップロード中…
          </p>
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
