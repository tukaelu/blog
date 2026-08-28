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
import { stableStringify } from '#shared/utils/stable-stringify'
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

// 自動保存はサーバーへ送らずlocalStorageにのみ保存する（うっかりブラウザを
// 閉じた場合の復元用途に限定。spec-article-editing.md §6.2）。
// 新規記事はid未発行の間'new'固定キー、既存記事はidキーで管理する。
function draftKey(): string {
  return `article-draft:${articleId.value ?? 'new'}`
}

type ArticleDraft = {
  title: string
  slug: string
  description: string
  tagNamesText: string
  status: 'draft' | 'published'
  publishedAt: string
  coverImageId: string
  bodyJson: TiptapNode
  savedAt: string
}

function currentDraftFields(): Omit<ArticleDraft, 'savedAt'> {
  return {
    title: title.value,
    slug: slug.value,
    description: description.value,
    tagNamesText: tagNamesText.value,
    status: status.value,
    publishedAt: publishedAt.value,
    coverImageId: coverImageId.value,
    bodyJson: bodyJson.value,
  }
}

// 直近でlocalStorageへ書き込んだ内容のスナップショット。blurするだけで
// 未変更のまま発火するautosaveトリガーで無駄な書き込みをしないための差分判定に使う
let lastSavedSnapshot = stableStringify(currentDraftFields())

function saveDraft() {
  const fields = currentDraftFields()
  const snapshot = stableStringify(fields)
  if (snapshot === lastSavedSnapshot) return
  lastSavedSnapshot = snapshot
  const draft: ArticleDraft = { ...fields, savedAt: new Date().toISOString() }
  try {
    localStorage.setItem(draftKey(), JSON.stringify(draft))
  } catch {
    // 容量超過等は執筆の妨げにしないため無視する
  }
}

function clearDraft(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // noop
  }
}

function restoreDraftIfNeeded() {
  let raw: string | null
  try {
    raw = localStorage.getItem(draftKey())
  } catch {
    return
  }
  if (!raw) return
  let draft: ArticleDraft
  try {
    draft = JSON.parse(raw)
  } catch {
    clearDraft(draftKey())
    return
  }
  const { savedAt, ...draftFields } = draft
  if (stableStringify(draftFields) === lastSavedSnapshot) {
    clearDraft(draftKey())
    return
  }
  const savedAtLabel = new Date(savedAt).toLocaleString('ja-JP')
  if (
    !confirm(
      `${savedAtLabel}時点の保存されていない変更が見つかりました。復元しますか？`
    )
  ) {
    clearDraft(draftKey())
    return
  }
  title.value = draft.title
  slug.value = draft.slug
  description.value = draft.description
  tagNamesText.value = draft.tagNamesText
  status.value = draft.status
  publishedAt.value = draft.publishedAt
  coverImageId.value = draft.coverImageId
  bodyJson.value = draft.bodyJson
  lastSavedSnapshot = stableStringify(draftFields)
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function triggerAutosave() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(saveDraft, 3000)
}

async function saveExplicit(newStatus: 'draft' | 'published') {
  // explicitSaving.value=trueの反映（ボタンのdisabled化）はDOM更新を待つため、
  // 反映前の連打による二重POST/PUTをここで同期的にガードする
  if (explicitSaving.value) return
  if (debounceTimer) clearTimeout(debounceTimer)
  explicitSaving.value = true
  saveErrorMessage.value = null
  const draftKeyBefore = draftKey()
  const body = {
    title: title.value,
    slug: slug.value || `draft-${Date.now()}`,
    bodyJson: bodyJson.value,
    description: description.value || null,
    tagNames: currentTagNames(),
    status: newStatus,
    publishedAt:
      newStatus === 'published'
        ? (toIsoOrNull(publishedAt.value) ?? new Date().toISOString())
        : toIsoOrNull(publishedAt.value),
    coverImageId: coverImageId.value || null,
  }
  try {
    if (articleId.value) {
      await $fetch(`/api/admin/articles/${articleId.value}`, {
        method: 'PUT',
        body,
      })
    } else {
      const res = await $fetch<{ id: string }>('/api/admin/articles', {
        method: 'POST',
        body,
      })
      articleId.value = res.id
      router.replace(`/admin/articles/${res.id}`)
    }
    clearDraft(draftKeyBefore)
    lastSavedSnapshot = stableStringify(currentDraftFields())
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

onMounted(restoreDraftIfNeeded)

onBeforeUnmount(() => {
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
