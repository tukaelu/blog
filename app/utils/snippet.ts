export interface SnippetPart {
  text: string
  highlighted: boolean
}

// FTS5のsnippet()が返す<mark>タグ入りHTMLを、v-htmlを使わず安全に表示するためパーツに分解する
// （記事本文はプレーンテキスト抽出結果であり、意図しないHTMLタグの混入をそのまま描画しないため）。
export function parseSnippet(snippet: string): SnippetPart[] {
  const parts: SnippetPart[] = []
  const regex = /<mark>(.*?)<\/mark>/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(snippet))) {
    if (match.index > lastIndex) {
      parts.push({
        text: snippet.slice(lastIndex, match.index),
        highlighted: false,
      })
    }
    parts.push({ text: match[1] ?? '', highlighted: true })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < snippet.length) {
    parts.push({ text: snippet.slice(lastIndex), highlighted: false })
  }
  return parts
}
