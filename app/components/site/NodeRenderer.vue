<script setup lang="ts">
import type { TiptapNode } from '#shared/types/tiptap-nodes'
import { buildHeadingAnchors } from '#shared/utils/heading-anchor'

const props = defineProps<{ node: TiptapNode; anchor?: string }>()

function textContent(node: TiptapNode): string {
  if (node.text) return node.text
  return (node.content ?? []).map(textContent).join('')
}

const headingTag = computed(() => `h${props.node.attrs?.level ?? 2}`)

// server/utils/toc.tsのbuildTocと同じ入力（文書内の全見出しテキストの出現順配列）から
// 同じアルゴリズムでアンカーを算出し、doc直下の子へ渡す。これによりTOCのリンク先(#anchor)と
// 見出しのDOM idが同一テキストの見出しが複数あっても一致し、重複idにならない。
const headingAnchorByIndex = computed(() => {
  const map = new Map<number, string>()
  if (props.node.type !== 'doc') return map
  const content = props.node.content ?? []
  const headingIndices: number[] = []
  const texts: string[] = []
  content.forEach((child, i) => {
    if (child.type === 'heading') {
      headingIndices.push(i)
      texts.push(textContent(child))
    }
  })
  buildHeadingAnchors(texts).forEach((anchor, j) => {
    const index = headingIndices[j]
    if (index !== undefined) map.set(index, anchor)
  })
  return map
})
</script>

<template>
  <!-- 独自ノード（linkCard/embed/mermaid/footnote）はフェーズ4で追加。未知の type はここでフォールバック表示する -->
  <template v-if="node.type === 'doc'">
    <SiteNodeRenderer
      v-for="(child, i) in node.content"
      :key="i"
      :node="child"
      :anchor="headingAnchorByIndex.get(i)"
    />
  </template>

  <p v-else-if="node.type === 'paragraph'">
    <SiteNodeRenderer
      v-for="(child, i) in node.content ?? []"
      :key="i"
      :node="child"
    />
  </p>

  <component
    :is="headingTag"
    v-else-if="node.type === 'heading'"
    :id="props.anchor ?? textContent(node)"
  >
    <SiteNodeRenderer
      v-for="(child, i) in node.content ?? []"
      :key="i"
      :node="child"
    />
  </component>

  <blockquote v-else-if="node.type === 'blockquote'">
    <SiteNodeRenderer
      v-for="(child, i) in node.content ?? []"
      :key="i"
      :node="child"
    />
  </blockquote>

  <ul v-else-if="node.type === 'bulletList'">
    <SiteNodeRenderer
      v-for="(child, i) in node.content ?? []"
      :key="i"
      :node="child"
    />
  </ul>

  <ol v-else-if="node.type === 'orderedList'">
    <SiteNodeRenderer
      v-for="(child, i) in node.content ?? []"
      :key="i"
      :node="child"
    />
  </ol>

  <li v-else-if="node.type === 'listItem'">
    <SiteNodeRenderer
      v-for="(child, i) in node.content ?? []"
      :key="i"
      :node="child"
    />
  </li>

  <SiteNodesCodeBlock
    v-else-if="node.type === 'codeBlock'"
    :code="textContent(node)"
    :language="node.attrs?.language ? String(node.attrs.language) : null"
    :filepath="node.attrs?.filepath ? String(node.attrs.filepath) : null"
  />

  <img
    v-else-if="node.type === 'image'"
    :src="String(node.attrs?.src ?? '')"
    :alt="String(node.attrs?.alt ?? '')"
  />

  <br v-else-if="node.type === 'hardBreak'" />

  <SiteNodesLinkCard
    v-else-if="node.type === 'linkCard'"
    :url="String(node.attrs?.url ?? '')"
  />

  <SiteNodesFootnote
    v-else-if="node.type === 'footnote'"
    :content="String(node.attrs?.content ?? '')"
  />

  <SiteNodesEmbed
    v-else-if="node.type === 'embed'"
    :provider="String(node.attrs?.provider ?? '')"
    :url="String(node.attrs?.url ?? '')"
  />

  <!-- mermaid.jsがDOM操作に依存するためクライアント専用。SSR/JS無効時はソースをそのまま表示する -->
  <ClientOnly v-else-if="node.type === 'mermaid'">
    <SiteNodesMermaid :source="String(node.attrs?.source ?? '')" />
    <template #fallback>
      <pre>{{ String(node.attrs?.source ?? '') }}</pre>
    </template>
  </ClientOnly>

  <SiteMarkedText
    v-else-if="node.type === 'text'"
    :text="node.text ?? ''"
    :marks="node.marks ?? []"
  />

  <!-- 未対応・未知のノードタイプ: プレーンテキストとしてフォールバック表示 -->
  <template v-else>{{ textContent(node) }}</template>
</template>
