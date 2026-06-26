import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import type { TiptapMark, TiptapNode } from '../shared/types/tiptap-nodes'

// remark-parse + remark-gfm が生成するmdastノードのうち、このプロジェクトの
// 既存記事（contents/posts/ja配下）で実際に使われている型だけをカバーする
// 最小限の形（`@types/mdast`は使わず、実データの精査結果に基づき自前定義する）。
interface MdNode {
  type: string
  children?: MdNode[]
  value?: string
  depth?: number
  ordered?: boolean | null
  url?: string
  alt?: string | null
  lang?: string | null
  identifier?: string
}

export interface ConvertResult {
  doc: TiptapNode
  manualReview: string[]
}

// `<EmbeddedLink url="..." />`はMDXコンポーネント呼び出しだが、remark-mdxを使わなくても
// remark-parseのCommonMark HTMLブロック規則（type 7: 未知のタグ名の完全なタグ）により
// mdastの`html`ノードとしてそのまま拾える（migration.md §6 決定事項）。
const EMBEDDED_LINK_RE = /^<EmbeddedLink\s+url=["']([^"']+)["']\s*\/?>$/

// フロントマター直後の`import EmbeddedLink from '@components/mdx/...'`はMDX特有の
// import文であり、remark-parseには文法的な意味を持たない生テキストとして残ってしまうため、
// パース前に取り除く。
function stripMdxImports(markdown: string): string {
  return markdown
    .split('\n')
    .filter(line => !/^import\s+\w+\s+from\s+['"]@components\/mdx\//.test(line))
    .join('\n')
}

export function markdownToTiptap(markdown: string): ConvertResult {
  const manualReview: string[] = []
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(stripMdxImports(markdown)) as unknown as MdNode

  const footnotes = new Map<string, string>()
  for (const node of tree.children ?? []) {
    if (node.type === 'footnoteDefinition' && node.identifier) {
      footnotes.set(
        node.identifier,
        footnoteText(node, node.identifier, manualReview)
      )
    }
  }

  const content = (tree.children ?? [])
    .filter(node => node.type !== 'footnoteDefinition')
    .flatMap(node => mapBlock(node, footnotes, manualReview))

  return { doc: { type: 'doc', content }, manualReview }
}

// 脚注ノード（server/utils/footnotes.ts）はcontentをプレーン文字列で持つ設計のため、
// 脚注定義側にリンクや強調等の書式が含まれていた場合は失われる。その場合のみ警告する。
function footnoteText(
  node: MdNode,
  identifier: string,
  manualReview: string[]
): string {
  let hasRichContent = false
  function walk(n: MdNode): string {
    if (n.type === 'text' || n.type === 'inlineCode') return n.value ?? ''
    if (n.type !== 'paragraph' && (n.children?.length ?? 0) > 0)
      hasRichContent = true
    return (n.children ?? []).map(walk).join('')
  }
  const text = (node.children ?? []).map(walk).join('\n').trim()
  if (hasRichContent) {
    manualReview.push(
      `脚注 [^${identifier}] にリンク等の書式が含まれていたため、プレーンテキストに変換しました: "${text}"`
    )
  }
  return text
}

function mapBlock(
  node: MdNode,
  footnotes: Map<string, string>,
  manualReview: string[]
): TiptapNode[] {
  switch (node.type) {
    case 'heading':
      return [
        {
          type: 'heading',
          attrs: { level: node.depth ?? 2 },
          content: mapInlineChildren(node, footnotes, manualReview),
        },
      ]

    case 'paragraph':
      // 画像（image）はTiptap側でblockグループのノードのため、paragraphの中には
      // ネストできない。paragraphの子を画像の前後で分割し、doc直下の兄弟ノードにする。
      return splitParagraphAroundImages(node, footnotes, manualReview)

    case 'blockquote':
      return [
        {
          type: 'blockquote',
          content: (node.children ?? []).flatMap(child =>
            mapBlock(child, footnotes, manualReview)
          ),
        },
      ]

    case 'list':
      return [
        {
          type: node.ordered ? 'orderedList' : 'bulletList',
          content: (node.children ?? []).map(item => ({
            type: 'listItem',
            content: (item.children ?? []).flatMap(child =>
              mapBlock(child, footnotes, manualReview)
            ),
          })),
        },
      ]

    case 'code':
      return [
        {
          type: 'codeBlock',
          attrs: { language: node.lang ?? null, filepath: null },
          content: node.value ? [{ type: 'text', text: node.value }] : [],
        },
      ]

    case 'thematicBreak':
      // 現行10記事では未使用（実データ精査済み）。公開ページのレンダラー（NodeRenderer.vue）は
      // horizontalRuleに未対応のため、万一出現した場合に気づけるよう要確認リストに載せる。
      manualReview.push(
        '区切り線（thematicBreak）をhorizontalRuleへ変換しましたが、公開ページのレンダラーは未対応です'
      )
      return [{ type: 'horizontalRule' }]

    case 'html':
      return mapHtmlBlock(node, manualReview)

    default:
      manualReview.push(
        `未対応のMarkdownブロック（type: ${node.type}）をスキップしました`
      )
      return []
  }
}

function splitParagraphAroundImages(
  node: MdNode,
  footnotes: Map<string, string>,
  manualReview: string[]
): TiptapNode[] {
  const blocks: TiptapNode[] = []
  let buffer: TiptapNode[] = []
  const flush = () => {
    if (buffer.length) blocks.push({ type: 'paragraph', content: buffer })
    buffer = []
  }
  for (const child of node.children ?? []) {
    if (child.type === 'image') {
      flush()
      blocks.push(imageNode(child))
    } else {
      buffer.push(...mapInline(child, [], footnotes, manualReview))
    }
  }
  flush()
  return blocks
}

function mapHtmlBlock(node: MdNode, manualReview: string[]): TiptapNode[] {
  const raw = (node.value ?? '').trim()
  if (!raw) return []
  const linkCard = raw.match(EMBEDDED_LINK_RE)
  if (linkCard) return [{ type: 'linkCard', attrs: { url: linkCard[1] } }]
  manualReview.push(
    `未対応のHTML/JSX構文をスキップしました: ${raw.slice(0, 120)}`
  )
  return []
}

function mapInlineChildren(
  node: MdNode,
  footnotes: Map<string, string>,
  manualReview: string[]
): TiptapNode[] {
  return (node.children ?? []).flatMap(child =>
    mapInline(child, [], footnotes, manualReview)
  )
}

function mapInline(
  node: MdNode,
  marks: TiptapMark[],
  footnotes: Map<string, string>,
  manualReview: string[]
): TiptapNode[] {
  switch (node.type) {
    case 'text':
      return node.value ? [textNode(node.value, marks)] : []

    case 'inlineCode':
      return node.value
        ? [textNode(node.value, [...marks, { type: 'code' }])]
        : []

    case 'strong':
      return (node.children ?? []).flatMap(child =>
        mapInline(child, [...marks, { type: 'bold' }], footnotes, manualReview)
      )

    case 'emphasis':
      return (node.children ?? []).flatMap(child =>
        mapInline(
          child,
          [...marks, { type: 'italic' }],
          footnotes,
          manualReview
        )
      )

    case 'delete':
      return (node.children ?? []).flatMap(child =>
        mapInline(
          child,
          [...marks, { type: 'strike' }],
          footnotes,
          manualReview
        )
      )

    case 'link':
      return (node.children ?? []).flatMap(child =>
        mapInline(
          child,
          [...marks, { type: 'link', attrs: { href: node.url ?? '' } }],
          footnotes,
          manualReview
        )
      )

    case 'break':
      return [{ type: 'hardBreak' }]

    case 'image':
      return [imageNode(node)]

    case 'footnoteReference': {
      const content = node.identifier
        ? footnotes.get(node.identifier)
        : undefined
      if (content === undefined) {
        manualReview.push(
          `脚注参照 [^${node.identifier}] に対応する定義が見つかりませんでした`
        )
        return []
      }
      return [{ type: 'footnote', attrs: { content } }]
    }

    case 'html': {
      const raw = (node.value ?? '').trim()
      if (raw)
        manualReview.push(
          `未対応のインラインHTML/JSX構文をスキップしました: ${raw.slice(0, 120)}`
        )
      return []
    }

    default:
      manualReview.push(
        `未対応のインラインMarkdownノード（type: ${node.type}）をスキップしました`
      )
      return (node.children ?? []).flatMap(child =>
        mapInline(child, marks, footnotes, manualReview)
      )
  }
}

function textNode(text: string, marks: TiptapMark[]): TiptapNode {
  return marks.length ? { type: 'text', text, marks } : { type: 'text', text }
}

function imageNode(node: MdNode): TiptapNode {
  return { type: 'image', attrs: { src: node.url ?? '', alt: node.alt ?? '' } }
}
