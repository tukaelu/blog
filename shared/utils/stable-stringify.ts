// キー挿入順に依存しないJSON文字列化。ProseMirror（Tiptap）が生成するノードの
// プロパティ順（type→attrs→content→marks→text）と、サーバー保存値やMarkdown移行
// スクリプトが生成するオブジェクトのプロパティ順は一致するとは限らないため、
// 意味的に同一のオブジェクトを文字列比較で「差分あり」と誤判定しないようにする。
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.fromEntries(
        Object.entries(val).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      )
    }
    return val
  })
}
