import { z } from 'zod'

// spec-article-editing.md §5: 英数字・ハイフンのみ、記事間でユニーク（ユニーク制約はDB側で担保）
export const slugSchema = z
  .string()
  .min(1)
  .regex(
    /^[a-z0-9-]+$/,
    'slug must contain only lowercase letters, numbers, and hyphens'
  )

// タグ名（フリーテキスト入力）からslugSchemaに適合するslugを生成する。
// 英数字以外（日本語名や記号）しか残らない場合はランダムなIDにフォールバックする
// （sitemap.xml等への未エスケープ出力を安全にするため、記事slugと同じ文字種に制限する）。
export function slugifyTagName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || crypto.randomUUID()
}
