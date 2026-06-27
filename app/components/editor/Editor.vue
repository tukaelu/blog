<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import {
  BoldIcon,
  CircleHelpIcon,
  Code2Icon,
  CornerDownLeftIcon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  PlusIcon,
  QuoteIcon,
  SuperscriptIcon,
  WorkflowIcon,
} from '@lucide/vue'
import { LinkCard } from './nodes/link-card'
import { Footnote } from './nodes/footnote'
import { Embed } from './nodes/embed'
import { embedProviders } from './nodes/embed-providers'
import { CodeBlockWithFilepath } from './nodes/code-block'
import { Mermaid } from './nodes/mermaid'
import AdminMediaPickerModal from '~/components/admin/MediaPickerModal.vue'
import type { TiptapNode } from '#shared/types/tiptap-nodes'

const props = defineProps<{ modelValue: TiptapNode }>()
const emit = defineEmits<{
  'update:modelValue': [value: TiptapNode]
  blur: []
}>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    Placeholder.configure({ placeholder: '本文を書く' }),
    Image,
    LinkCard,
    Footnote,
    Embed,
    CodeBlockWithFilepath,
    Mermaid,
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getJSON() as TiptapNode)
  },
  onBlur: () => emit('blur'),
})

const mediaPickerRef = ref<InstanceType<typeof AdminMediaPickerModal>>()
function onImageSelected(item: { url: string }) {
  editor.value?.chain().focus().setImage({ src: item.url }).run()
}

function insertLinkCard() {
  editor.value
    ?.chain()
    .focus()
    .insertContent({ type: 'linkCard', attrs: { url: '' } })
    .run()
}

function insertFootnote() {
  editor.value
    ?.chain()
    .focus()
    .insertContent({ type: 'footnote', attrs: { content: '' } })
    .run()
}

function insertEmbed(provider: string) {
  editor.value
    ?.chain()
    .focus()
    .insertContent({ type: 'embed', attrs: { provider, url: '' } })
    .run()
}

function insertMermaid() {
  editor.value
    ?.chain()
    .focus()
    .insertContent({ type: 'mermaid', attrs: { source: '' } })
    .run()
}

function insertHardBreak() {
  editor.value?.chain().focus().setHardBreak().run()
}

const characterCount = computed(() => editor.value?.getText().length ?? 0)
const shortcutsOpen = ref(false)
// 実際にeditorに登録されている入力ルール・キーボードショートカットのみを載せる
// （しずかなインターネットの「操作一覧」を参考にしたが、ルビ等未実装の機能は含めない）。
const shortcuts = [
  { label: '見出し2', keys: '## ' },
  { label: '見出し3', keys: '### ' },
  { label: '見出し4', keys: '#### ' },
  { label: '箇条書き', keys: '- ' },
  { label: '番号付きリスト', keys: '1. ' },
  { label: '引用', keys: '> ' },
  { label: 'コードブロック', keys: '```' },
  { label: '太字', keys: '** ** / Cmd+B' },
  { label: '斜体', keys: '* * / Cmd+I' },
  { label: '取り消す', keys: 'Cmd+Z' },
  { label: 'やり直す', keys: 'Cmd+Shift+Z' },
]

defineExpose({
  focus: () => editor.value?.chain().focus().run(),
})

onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
  <div class="relative">
    <template v-if="editor">
      <BubbleMenu :editor="editor" :options="{ placement: 'top', offset: 8 }">
        <div
          class="flex items-center gap-0.5 rounded-full border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <Toggle
            size="sm"
            title="太字"
            :pressed="editor.isActive('bold')"
            @update:pressed="editor.chain().focus().toggleBold().run()"
          >
            <BoldIcon class="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            title="斜体"
            :pressed="editor.isActive('italic')"
            @update:pressed="editor.chain().focus().toggleItalic().run()"
          >
            <ItalicIcon class="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            title="見出し2"
            :pressed="editor.isActive('heading', { level: 2 })"
            @update:pressed="
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            "
          >
            <Heading2Icon class="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            title="見出し3"
            :pressed="editor.isActive('heading', { level: 3 })"
            @update:pressed="
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            "
          >
            <Heading3Icon class="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            title="見出し4"
            :pressed="editor.isActive('heading', { level: 4 })"
            @update:pressed="
              editor.chain().focus().toggleHeading({ level: 4 }).run()
            "
          >
            <Heading4Icon class="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            title="箇条書き"
            :pressed="editor.isActive('bulletList')"
            @update:pressed="editor.chain().focus().toggleBulletList().run()"
          >
            <ListIcon class="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            title="番号付きリスト"
            :pressed="editor.isActive('orderedList')"
            @update:pressed="editor.chain().focus().toggleOrderedList().run()"
          >
            <ListOrderedIcon class="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            title="引用"
            :pressed="editor.isActive('blockquote')"
            @update:pressed="editor.chain().focus().toggleBlockquote().run()"
          >
            <QuoteIcon class="size-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            title="コードブロック"
            :pressed="editor.isActive('codeBlock')"
            @update:pressed="editor.chain().focus().toggleCodeBlock().run()"
          >
            <Code2Icon class="size-3.5" />
          </Toggle>
        </div>
      </BubbleMenu>
    </template>

    <EditorContent
      :editor="editor"
      class="prose max-w-none dark:prose-invert"
    />

    <!-- 挿入系操作。常時表示のツールバーではなく、本文下の浮遊メニューにまとめる。
         外側のdivは編集エリア本体（mx-auto max-w-5xl px-6）と同じ中央寄せ・余白にして
         ブラウザ最下部に固定しつつ、中のピル自体は編集エリアの左端に揃える -->
    <div class="fixed inset-x-0 bottom-6 z-20 mx-auto max-w-5xl px-6">
      <div
        class="flex w-fit items-center gap-1 rounded-full border bg-background/90 p-1 shadow-sm backdrop-blur"
      >
        <span class="px-2 text-xs tabular-nums text-muted-foreground">{{
          characterCount
        }}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="画像を挿入"
          @click="mediaPickerRef?.open()"
        >
          <ImageIcon class="size-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button type="button" variant="ghost" size="icon-sm" title="挿入">
              <PlusIcon class="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" class="w-48">
            <DropdownMenuItem @click="insertLinkCard">
              <LinkIcon class="size-4" />リンクカード
            </DropdownMenuItem>
            <DropdownMenuItem @click="insertFootnote">
              <SuperscriptIcon class="size-4" />脚注
            </DropdownMenuItem>
            <DropdownMenuItem
              v-for="item in embedProviders"
              :key="item.provider"
              @click="insertEmbed(item.provider)"
            >
              <component :is="item.icon" class="size-4" />{{ item.label }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="insertMermaid">
              <WorkflowIcon class="size-4" />Mermaid図表
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="insertHardBreak">
              <CornerDownLeftIcon class="size-4" />改行（段落を変えない）
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="操作一覧"
          @click="shortcutsOpen = true"
        >
          <CircleHelpIcon class="size-4" />
        </Button>
        <slot name="extra-actions" />
        <AdminMediaPickerModal ref="mediaPickerRef" @select="onImageSelected" />
      </div>
    </div>

    <Dialog v-model:open="shortcutsOpen">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>操作一覧</DialogTitle>
          <DialogDescription
            >Markdown記法やキーボードショートカットで書式を適用できます。</DialogDescription
          >
        </DialogHeader>
        <dl class="flex flex-col gap-2 text-sm">
          <div
            v-for="item in shortcuts"
            :key="item.label"
            class="flex items-center justify-between gap-4"
          >
            <dt class="text-muted-foreground">{{ item.label }}</dt>
            <dd>
              <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{{
                item.keys
              }}</code>
            </dd>
          </div>
        </dl>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
:deep(.ProseMirror) {
  outline: none;
}

/* @tiptap/extension-placeholderは疑似要素のスタイルを自前で持たないため、Tiptap公式ドキュメント通りに定義する */
:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  color: var(--color-muted-foreground);
  pointer-events: none;
}
</style>
