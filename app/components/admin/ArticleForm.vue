<script setup lang="ts">
import {
  CheckIcon,
  HistoryIcon,
  PencilLineIcon,
  SettingsIcon,
  XIcon,
} from '@lucide/vue'
import type { AdminArticleDetail } from '#shared/types/article'
import type { TiptapNode } from '#shared/types/tiptap-nodes'
import AdminMediaPickerModal from './MediaPickerModal.vue'

const props = defineProps<{ initial: AdminArticleDetail | null }>()

const router = useRouter()

const articleId = ref<string | null>(props.initial?.id ?? null)
const title = ref(props.initial?.title ?? '')
const slug = ref(props.initial?.slug ?? '')
const description = ref(props.initial?.description ?? '')
const tagNamesText = ref((props.initial?.tagNames ?? []).join(', '))
const status = ref<'draft' | 'published'>(props.initial?.status ?? 'draft')
const settingsOpen = ref(false)

// <input type="datetime-local"> はタイムゾーンなしのローカル時刻文字列を扱うため、
// サーバーが保持するUTC ISO文字列との間で相互変換する。
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toIsoOrNull(local: string): string | null {
  if (!local) return null
  return new Date(local).toISOString()
}

const publishedAt = ref(toDatetimeLocal(props.initial?.publishedAt))
const coverImageId = ref(props.initial?.coverImageId ?? '')
const coverImageUrl = ref('')
const coverPickerRef = ref<InstanceType<typeof AdminMediaPickerModal>>()

function onCoverImageSelected(item: { id: string; url: string }) {
  coverImageId.value = item.id
  coverImageUrl.value = item.url
  triggerAutosave()
}
// content: [] だと段落ノードが1つも無いDOMになり、Placeholder拡張の
// `:first-child`セレクタが当たる要素が無くプレースホルダーが出せないため、
// 空の段落を1つ持たせた状態を初期値にする。
const bodyJson = ref<TiptapNode>(
  props.initial?.bodyJson ?? { type: 'doc', content: [{ type: 'paragraph' }] }
)

const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const saveErrorMessage = ref<string | null>(null)
const explicitSaving = ref(false)

// サーバーのarticleInputSchema（公開時のdescription/publishedAt必須チェック等）が
// 返すZodErrorのpathから、ユーザーに原因が伝わる短いメッセージへ変換する。
// 未知のエラーはnullを返し、汎用メッセージにフォールバックさせる。
function extractValidationMessage(err: unknown): string | null {
  const raw = (err as { data?: { data?: { message?: string } } })?.data?.data
    ?.message
  if (!raw) return null
  try {
    const issues = JSON.parse(raw) as { path: string[] }[]
    if (issues.some(issue => issue.path.includes('description'))) {
      settingsOpen.value = true
      return '概要文が未入力です。公開するには概要文の入力が必要です'
    }
    if (issues.some(issue => issue.path.includes('publishedAt'))) {
      settingsOpen.value = true
      return '公開日時が未設定です'
    }
  } catch {
    return null
  }
  return null
}

function currentTagNames(): string[] {
  return tagNamesText.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

// 新規作成時、id発行前は仮のスラッグで作成する。明示保存時にユーザー入力のスラッグへ更新される
// （spec-article-editing.md §6.1: タイトル/本文への最初の変更をトリガーに自動保存相当でidを発行する）。
// ダブルクリックや自動保存との競合で二重作成しないよう、実行中のPromiseを共有する。
let creatingPromise: Promise<string> | null = null
let isUnmounted = false
async function ensureCreated(): Promise<string> {
  if (articleId.value) return articleId.value
  if (creatingPromise) return creatingPromise
  creatingPromise = (async () => {
    const res = await $fetch<{ id: string }>('/api/admin/articles', {
      method: 'POST',
      body: {
        title: title.value || '無題の記事',
        slug: slug.value || `draft-${Date.now()}`,
        bodyJson: bodyJson.value,
        description: description.value || null,
        tagNames: currentTagNames(),
        status: 'draft',
        publishedAt: null,
      },
    })
    articleId.value = res.id
    // POST中にユーザーが既に画面を離れていた場合、離脱先のページから
    // 作成直後の編集画面へ強制的に引き戻さない
    if (!isUnmounted) router.replace(`/admin/articles/${res.id}`)
    return res.id
  })()
  try {
    return await creatingPromise
  } finally {
    creatingPromise = null
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null
// 発火済みで実行中のautosaveリクエストへの参照。debounceTimerのclearTimeoutは
// 未発火のタイマーしか止められないため、これを別途保持してsaveExplicitから待ち合わせる
let autosaveInFlight: Promise<void> | null = null

function triggerAutosave() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    autosaveInFlight = doAutosave().finally(() => {
      autosaveInFlight = null
    })
  }, 3000)
}

async function doAutosave() {
  const id = await ensureCreated()
  saveState.value = 'saving'
  saveErrorMessage.value = null
  try {
    await $fetch(`/api/admin/articles/${id}/autosave`, {
      method: 'PATCH',
      body: {
        title: title.value,
        description: description.value || null,
        bodyJson: bodyJson.value,
        // slugは空文字だとバリデーションエラーになるため未入力時は送らない
        ...(slug.value ? { slug: slug.value } : {}),
        tagNames: currentTagNames(),
        coverImageId: coverImageId.value || null,
        publishedAt: toIsoOrNull(publishedAt.value),
      },
    })
    saveState.value = 'saved'
  } catch {
    saveState.value = 'error'
  }
}

async function saveExplicit(newStatus: 'draft' | 'published') {
  // 保留中（未発火）のautosaveタイマーはキャンセルする。既に発火し実行中の
  // autosaveリクエストがあれば、その完了を待ってから明示保存を送ることで、
  // 古い内容のPATCHが明示保存の後に遅れて届いて上書きする競合を防ぐ
  if (debounceTimer) clearTimeout(debounceTimer)
  if (autosaveInFlight) await autosaveInFlight
  const id = await ensureCreated()
  explicitSaving.value = true
  saveErrorMessage.value = null
  try {
    await $fetch(`/api/admin/articles/${id}`, {
      method: 'PUT',
      body: {
        title: title.value,
        slug: slug.value,
        bodyJson: bodyJson.value,
        description: description.value || null,
        tagNames: currentTagNames(),
        status: newStatus,
        publishedAt:
          newStatus === 'published'
            ? (toIsoOrNull(publishedAt.value) ?? new Date().toISOString())
            : toIsoOrNull(publishedAt.value),
        coverImageId: coverImageId.value || null,
      },
    })
    status.value = newStatus
    saveState.value = 'saved'
  } catch (err) {
    saveState.value = 'error'
    saveErrorMessage.value = extractValidationMessage(err)
  } finally {
    explicitSaving.value = false
  }
}

function onEditorUpdate() {
  triggerAutosave()
}

const editorRef = ref<{ focus: () => void }>()
const titleArea = ref<HTMLTextAreaElement>()
function resizeTitle() {
  const el = titleArea.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}
watch(title, () => nextTick(resizeTitle))
onMounted(resizeTitle)

function onTitleEnter(event: KeyboardEvent) {
  event.preventDefault()
  editorRef.value?.focus()
}

onBeforeUnmount(() => {
  isUnmounted = true
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div>
    <header
      class="sticky top-0 z-10 grid grid-cols-3 items-center gap-2 bg-background/90 px-4 py-3 backdrop-blur"
    >
      <div>
        <Button as-child variant="ghost" size="icon-sm" title="閉じる">
          <NuxtLink to="/admin/articles"><XIcon class="size-4" /></NuxtLink>
        </Button>
      </div>

      <div class="flex justify-center">
        <span
          class="inline-flex h-7 items-center gap-1 rounded-full bg-muted px-3 text-xs text-muted-foreground"
        >
          <CheckIcon
            v-if="saveState === 'saved' || saveState === 'idle'"
            class="size-3.5"
          />
          <template v-if="saveState === 'saving'">保存中…</template>
          <template v-else-if="saveState === 'error'">{{
            saveErrorMessage ?? '保存に失敗しました'
          }}</template>
          <template v-else>保存済み</template>
        </span>
      </div>

      <div class="flex items-center justify-end gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="sm" :disabled="explicitSaving">
              <PencilLineIcon v-if="status === 'draft'" class="size-3.5" />
              <CheckIcon v-else class="size-3.5" />
              {{ status === 'draft' ? '下書き' : '公開済み' }}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="saveExplicit('draft')"
              >下書きにする</DropdownMenuItem
            >
            <DropdownMenuItem @click="saveExplicit('published')"
              >公開する</DropdownMenuItem
            >
          </DropdownMenuContent>
        </DropdownMenu>
        <SiteThemeToggle />
      </div>
    </header>

    <div class="mx-auto w-full max-w-5xl px-6 pt-10 pb-32">
      <textarea
        ref="titleArea"
        v-model="title"
        rows="1"
        placeholder="タイトル"
        class="mb-6 w-full resize-none overflow-hidden border-none bg-transparent p-0 text-2xl font-bold leading-snug outline-none placeholder:text-muted-foreground/50"
        @keydown.enter="onTitleEnter"
        @blur="triggerAutosave"
      />
      <ClientOnly>
        <Editor
          ref="editorRef"
          v-model="bodyJson"
          @update:model-value="onEditorUpdate"
          @blur="triggerAutosave"
        >
          <template #extra-actions>
            <Button
              v-if="articleId"
              as-child
              variant="ghost"
              size="icon-sm"
              title="リビジョン履歴"
            >
              <NuxtLink :to="`/admin/articles/${articleId}/revisions`"
                ><HistoryIcon class="size-4"
              /></NuxtLink>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              title="記事の設定"
              @click="settingsOpen = true"
            >
              <SettingsIcon class="size-4" />
            </Button>
          </template>
        </Editor>
      </ClientOnly>
    </div>

    <Dialog v-model:open="settingsOpen">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>記事の設定</DialogTitle>
          <DialogDescription
            >タグ・アイキャッチ・公開日時を編集します。</DialogDescription
          >
        </DialogHeader>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <Label>スラッグ</Label>
            <Input
              v-model="slug"
              placeholder="スラッグ（例: my-post）"
              @blur="triggerAutosave"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label>タグ（カンマ区切り）</Label>
            <Input v-model="tagNamesText" @blur="triggerAutosave" />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label>アイキャッチ画像</Label>
            <img
              v-if="coverImageUrl"
              :src="coverImageUrl"
              width="120"
              alt="アイキャッチプレビュー"
              class="rounded-md"
            />
            <span v-else-if="coverImageId" class="text-sm text-muted-foreground"
              >設定済み（変更する場合は再度選択）</span
            >
            <Button
              type="button"
              variant="outline"
              size="sm"
              class="w-fit"
              @click="coverPickerRef?.open()"
              >選択</Button
            >
            <AdminMediaPickerModal
              ref="coverPickerRef"
              @select="onCoverImageSelected"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label>概要文</Label>
            <Textarea
              v-model="description"
              maxlength="200"
              @blur="triggerAutosave"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label>公開日時</Label>
            <Input
              v-model="publishedAt"
              type="datetime-local"
              @blur="triggerAutosave"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
