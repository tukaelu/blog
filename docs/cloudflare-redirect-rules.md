# Cloudflare Redirect Rules 設定案

旧ドメイン `blog.nsymtks.com` から新ドメイン `nsymtks.com` へのクロスドメインリダイレクト。
Cloudflare Dashboard > Rules > Redirect Rules で設定する。

## ルール 1: 記事ページのリダイレクト

- **条件**: Hostname equals `blog.nsymtks.com` AND URI Path starts with `/entry/`
- **アクション**: Dynamic Redirect
- **URL**: `concat("https://nsymtks.com/posts/", substring(http.request.uri.path, 8))`
- **ステータスコード**: 301

## ルール 2: その他のページのリダイレクト

- **条件**: Hostname equals `blog.nsymtks.com`
- **アクション**: Dynamic Redirect
- **URL**: `concat("https://nsymtks.com", http.request.uri.path)`
- **ステータスコード**: 301

※ ルール 1 を先に評価させること（記事 URL のパス変換が必要なため）。
