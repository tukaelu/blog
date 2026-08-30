import { relations } from 'drizzle-orm'
import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  unique,
  type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core'

// メディア（R2オブジェクトのメタデータ）
export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  r2Key: text('r2_key').notNull(),
  mimeType: text('mime_type').notNull(),
  width: integer('width'),
  height: integer('height'),
  createdAt: text('created_at').notNull(),
})

// 記事
export const articles = sqliteTable('articles', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  bodyJson: text('body_json').notNull(),
  bodyText: text('body_text').notNull(),
  coverImageId: text('cover_image_id').references(() => media.id),
  status: text('status').notNull().default('draft'),
  publishedAt: text('published_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// タグ
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
})

// 記事とタグの中間テーブル
export const articleTags = sqliteTable(
  'article_tags',
  {
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  table => [primaryKey({ columns: [table.articleId, table.tagId] })]
)

// いいね（重複防止のためarticle_id+client_idを複合主キーにする）
export const likes = sqliteTable(
  'likes',
  {
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    clientId: text('client_id').notNull(),
    createdAt: text('created_at').notNull(),
  },
  table => [primaryKey({ columns: [table.articleId, table.clientId] })]
)

// リビジョン（記事の明示的保存時点のスナップショット）
export const articleRevisions = sqliteTable(
  'article_revisions',
  {
    id: text('id').primaryKey(),
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    revisionNo: integer('revision_no').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    bodyJson: text('body_json').notNull(),
    status: text('status').notNull(),
    publishedAt: text('published_at'),
    revertOf: text('revert_of').references(
      (): AnySQLiteColumn => articleRevisions.id
    ),
    createdAt: text('created_at').notNull(),
  },
  table => [unique().on(table.articleId, table.revisionNo)]
)

// articles_fts（FTS5仮想テーブル）はDrizzleのテーブルビルダーで表現できないため
// スキーマには含めない。migrations/配下のSQLファイルでのみ管理し、
// クエリはserver/utils/search-index.ts・server/api/search.get.tsでsqlテンプレートを使う。

export const articlesRelations = relations(articles, ({ one, many }) => ({
  coverImage: one(media, {
    fields: [articles.coverImageId],
    references: [media.id],
  }),
  articleTags: many(articleTags),
  revisions: many(articleRevisions),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  articleTags: many(articleTags),
}))

export const articleTagsRelations = relations(articleTags, ({ one }) => ({
  article: one(articles, {
    fields: [articleTags.articleId],
    references: [articles.id],
  }),
  tag: one(tags, {
    fields: [articleTags.tagId],
    references: [tags.id],
  }),
}))

export const articleRevisionsRelations = relations(
  articleRevisions,
  ({ one }) => ({
    article: one(articles, {
      fields: [articleRevisions.articleId],
      references: [articles.id],
    }),
  })
)
