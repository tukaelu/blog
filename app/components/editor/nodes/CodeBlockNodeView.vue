<script setup lang="ts">
import { NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

const languages = [
  'javascript',
  'typescript',
  'sh',
  'html',
  'css',
  'json',
  'yaml',
  'python',
  'go',
]

function onLanguageChange(e: Event) {
  props.updateAttributes({
    language: (e.target as HTMLSelectElement).value || null,
  })
}

function onFilepathChange(e: Event) {
  props.updateAttributes({
    filepath: (e.target as HTMLInputElement).value || null,
  })
}
</script>

<template>
  <NodeViewWrapper>
    <div contenteditable="false">
      <input
        :value="node.attrs.filepath ?? ''"
        placeholder="ファイルパス（任意）"
        @input="onFilepathChange"
      />
      <select :value="node.attrs.language ?? ''" @change="onLanguageChange">
        <option value="">プレーンテキスト</option>
        <option v-for="lang in languages" :key="lang" :value="lang">
          {{ lang }}
        </option>
      </select>
    </div>
    <pre><NodeViewContent as="code" /></pre>
  </NodeViewWrapper>
</template>
