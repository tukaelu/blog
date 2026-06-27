// 見出しのテキストをそのままDOM idやTOCのアンカーに使うと、同一テキストの見出しが
// 複数あると重複idになり、無効なHTMLかつTOCリンクが常に最初の出現へ飛んでしまう。
// サーバー側のTOC生成（server/utils/toc.ts）とクライアント側の見出しid付与
// （app/components/site/NodeRenderer.vue）は別々のコンテキストで動くため状態を共有できないが、
// どちらも同じ見出しテキスト配列を出現順に渡せば、この純粋関数が決定的に同じ結果を返す。
export function buildHeadingAnchors(texts: string[]): string[] {
  const counts = new Map<string, number>()
  return texts.map(text => {
    const n = (counts.get(text) ?? 0) + 1
    counts.set(text, n)
    return n === 1 ? text : `${text}-${n}`
  })
}
