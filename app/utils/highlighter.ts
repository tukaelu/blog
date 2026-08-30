import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRawEngine } from 'shiki/engine/javascript'

// Cloudflare Workersではshiki本体のフルバンドル（全言語）を使うとスクリプトサイズ上限を超えるため、
// 対応言語を明示的に絞り込んだfine-grained bundleを使う（shiki公式のCloudflare Workers向け推奨構成）。
// oniguruma(WASM)エンジンはWorkers上でのロードが煩雑なため、JavaScript Regex Engineを採用する。
const langLoaders = {
  javascript: () => import('@shikijs/langs-precompiled/javascript'),
  typescript: () => import('@shikijs/langs-precompiled/typescript'),
  shellscript: () => import('@shikijs/langs-precompiled/shellscript'),
  html: () => import('@shikijs/langs-precompiled/html'),
  css: () => import('@shikijs/langs-precompiled/css'),
  json: () => import('@shikijs/langs-precompiled/json'),
  yaml: () => import('@shikijs/langs-precompiled/yaml'),
  python: () => import('@shikijs/langs-precompiled/python'),
  go: () => import('@shikijs/langs-precompiled/go'),
} as const

export type SupportedLanguage = keyof typeof langLoaders

const LANG_ALIASES: Record<string, SupportedLanguage> = { sh: 'shellscript' }

let highlighterPromise: Promise<HighlighterCore> | null = null

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import('@shikijs/themes/github-dark')],
      langs: Object.values(langLoaders).map(load => load()),
      engine: createJavaScriptRawEngine(),
    })
  }
  return highlighterPromise
}

function resolveLanguage(lang: string | null): SupportedLanguage {
  if (!lang) return 'javascript'
  const alias = LANG_ALIASES[lang]
  if (alias) return alias
  return lang in langLoaders ? (lang as SupportedLanguage) : 'javascript'
}

export async function highlightCode(
  code: string,
  lang: string | null
): Promise<string> {
  const highlighter = await getHighlighter()
  return highlighter.codeToHtml(code, {
    lang: resolveLanguage(lang),
    theme: 'github-dark',
  })
}
