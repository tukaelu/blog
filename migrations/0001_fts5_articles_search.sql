-- 全文検索用の仮想テーブル（FTS5）
-- 独立したFTS5テーブルとし、articlesとの同期はアプリケーション側（記事保存/削除API）で明示的に行う
-- （外部コンテンツテーブル方式は元テーブル更新時の同期にトリガーが必須になるため採らない）。
-- title/body_textには日本語検索精度向上のため Intl.Segmenter で分かち書き済みのテキストを保存する（architecture.md §9）。
-- Drizzleのテーブルビルダーでは仮想テーブルを表現できないため、このファイルで手書き管理する。
CREATE VIRTUAL TABLE articles_fts USING fts5(
  article_id UNINDEXED,
  title,
  body_text,
  tokenize='unicode61'
);