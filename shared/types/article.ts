import type { TiptapNode, TocItem } from './tiptap-nodes'

export interface ArticleTag {
  name: string
  slug: string
}

// GET /api/articles の一覧要素（spec-public-site.md §4.1）
export interface ArticleSummary {
  slug: string
  title: string
  description: string | null
  publishedAt: string
  tags: ArticleTag[]
  readingTimeMinutes: number
  coverImageUrl: string | null
}

export interface FootnoteItem {
  number: number
  content: string
}

// GET /api/articles/:slug の詳細（spec-public-site.md §4.2）
export interface ArticleDetail {
  id: string
  slug: string
  title: string
  description: string | null
  bodyJson: TiptapNode
  toc: TocItem[]
  footnotes: FootnoteItem[]
  publishedAt: string
  tags: ArticleTag[]
  readingTimeMinutes: number
  likeCount: number
}

export interface Pagination {
  page: number
  totalPages: number
  totalCount: number
}

export type ArticleStatus = 'draft' | 'published'

// GET /api/admin/articles の一覧要素（spec-article-editing.md §4.1）
export interface AdminArticleSummary {
  id: string
  slug: string
  title: string
  status: ArticleStatus
  publishedAt: string | null
  updatedAt: string
  tags: string[]
  characterCount: number
  likeCount: number
}

// 管理画面の記事編集フォームで扱うデータ（spec-article-editing.md §3.2, §4.2）
export interface AdminArticleDetail {
  id: string
  slug: string
  title: string
  description: string | null
  bodyJson: TiptapNode
  status: ArticleStatus
  publishedAt: string | null
  coverImageId: string | null
  tagNames: string[]
}

// GET /api/admin/articles/:id/revisions の一覧要素（spec-article-editing.md §4.6）
export interface RevisionSummary {
  id: string
  revisionNo: number
  title: string
  status: ArticleStatus
  createdAt: string
  revertOf: string | null
}

export interface DiffPart {
  type: 'equal' | 'added' | 'removed'
  value: string
}

// GET /api/admin/articles/:id/revisions/:revisionId/diff のレスポンス（spec-article-editing.md §4.8）
export interface RevisionDiff {
  titleDiff: DiffPart[]
  descriptionDiff: DiffPart[]
  bodyDiff: DiffPart[]
}
