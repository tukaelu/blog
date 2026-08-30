import { z } from 'zod'
import { slugSchema } from '#shared/utils/slug'
import { tiptapDocSchema } from '#shared/types/tiptap-nodes'

// spec-article-editing.md §4.2のバリデーションルール。
// tagIds ではなく tagNames を受け取る設計に変更した（タグ専用の管理API/画面が要件上未定義のため、
// 記事編集画面からのフリーテキスト入力で完結させる。§9 決定事項として spec-article-editing.md に反映）。
export const articleInputSchema = z
  .object({
    title: z.string().min(1).max(200),
    slug: slugSchema,
    bodyJson: tiptapDocSchema,
    description: z.string().max(200).nullable().optional(),
    tagNames: z.array(z.string()).default([]),
    status: z.enum(['draft', 'published']),
    publishedAt: z.string().nullable().optional(),
    coverImageId: z.string().nullable().optional(),
  })
  .refine(data => data.status !== 'published' || !!data.publishedAt, {
    message: 'publishedAt is required when status is published',
    path: ['publishedAt'],
  })
  .refine(data => data.status !== 'published' || !!data.description, {
    message: 'description is required when status is published',
    path: ['description'],
  })

export type ArticleInput = z.infer<typeof articleInputSchema>
