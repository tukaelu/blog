# 機能仕様書：認証・バックアップ・開発環境（運用基盤）

最終更新: 2026-08-28
関連ドキュメント: `requirements.md`（§6.3, §6.4, §6.6）, `architecture.md`（§7, §11, §13, §14）

---

## 1. 概要

管理画面の認証（Cloudflare Access）、データのバックアップ運用（D1 Time Travel / R2）、ローカル開発環境とPRプレビュー環境の構築手順を定義する。他の機能仕様書と異なり、画面・APIというより**設定・運用手順**が中心となる。

## 2. 関連要件

| 要件定義書の項番    | 内容                         |
| ------------------- | ---------------------------- |
| §6.3 セキュリティ   | 管理画面認証、AI APIキー管理 |
| §6.4 可用性・信頼性 | バックアップ方針             |
| §6.6 開発・検証環境 | ローカル開発、PRプレビュー   |

---

## 3. Cloudflare Accessの設定

### 3.1 保護対象

Cloudflare Zero Trustダッシュボードで新規アプリケーションを作成し、本番ドメインの以下のパスを保護対象とする。

- `/admin/*`（管理画面UI）
- `/api/admin/*`（管理API、AI執筆支援APIを含む）

### 3.2 認証方法・アクセスポリシー（確定）

- IdPはCloudflareアカウントログイン（One-time PIN等の標準認証）を使う。Google連携等の外部IdPは導入しない（2026-08-28変更、運用の単純さを優先）
- アクセスポリシーは「特定のメールアドレス（運営者本人）のみ許可」とする単純な許可リスト方式とする
- セッション有効期間は24時間とする

### 3.3 プレビュー環境の保護（確定）

PRプレビュー環境は `/admin/*` だけでなく、**公開ページを含めた全体**を保護対象とする。プレビュー環境には未公開のドラフト機能やテストデータが含まれ得るため、URLを知っていれば誰でも閲覧・操作できる状態は避ける。

Cloudflare Workersは2026年8月のアップデートでAccessポリシーをWorker本体に直接紐付けられるようになっており、これを利用する。

1. Cloudflareダッシュボードで対象Workerの `Settings > Domains & Routes` を開く
2. `workers.dev` の項目で `Enable Cloudflare Access` を選択する
3. 保護スコープを「プレビューデプロイのみ」に設定する（本番の`workers.dev`/カスタムドメインは対象外とし、公開サイトはこれまで通り誰でも閲覧できる状態を維持する）
4. アクセスポリシーは §3.2 と同様、運営者本人のメールアドレスのみ許可する

この設定により、`/admin/*`とは別に、プレビューURL全体（`<branch>-<worker-name>.<subdomain>.workers.dev`）へのアクセスに認証が要求されるようになる。

### 3.4 ローカル環境での扱い

- Cloudflare Accessはエッジ（DNS）レベルで機能するため、ローカル開発サーバー（`nuxi dev` / `wrangler dev`）には介在しない。ローカルでは管理画面の認証チェックを無条件にバイパスする実装とする（`architecture.md` §11.2）
- 発展的な選択肢として、Cloudflare Access側にはローカル開発時に認証済みユーザーの識別情報をシミュレートできる`dev`ブロック設定（`wrangler.jsonc`の`access.dev`）が用意されている。無条件バイパスよりも本番挙動に近い形でテストしたい場合は、実装時にこちらへの切り替えを検討してもよい

---

## 4. バックアップ運用

### 4.1 D1（確定）

追加の実装・運用作業は不要。**D1 Time Travel**（標準機能、常時有効）に一任する。

| 項目         | 内容                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| 保持期間     | Workers Freeプラン：過去7日 / Paidプラン：過去30日                                                                       |
| 復元コマンド | `wrangler d1 time-travel restore <DATABASE_NAME> --timestamp=<ISO8601>`                                                  |
| 運用上の注意 | 復元は指定タイムスタンプ時点への**ロールバック**であり、それ以降の変更は失われる。誤操作直後に速やかに実行することが前提 |

初回セットアップ完了後、実際に一度リストア手順を試し、動作を確認しておくことを推奨する（§8受け入れ基準）。

### 4.2 R2（確定）

当面バックアップを行わない。将来メディア量が増える、または誤操作への備えを厚くしたくなった場合の選択肢として、Backblaze B2への定期同期を選択肢として記録する（`architecture.md` §13.2）。**導入検討を開始するトリガーは「R2の容量が1GBを超えたら」とする。**

---

## 5. ローカル開発環境のセットアップ

### 5.1 前提

- Node.js（バージョンは既存サイトの`.node-version`に準拠する想定）
- pnpm
- Wrangler CLI

### 5.2 手順

1. リポジトリをクローンする
2. `pnpm install` で依存関係をインストールする
3. `.dev.vars.example` を `.dev.vars` にコピーし、`OPENAI_API_KEY`（開発用に本番と別のキーを推奨）等の値を設定する（`.dev.vars`は`.gitignore`対象）
4. `wrangler d1 migrations apply DB --local` でローカルD1にマイグレーションを適用する
5. `nuxi dev` で開発サーバーを起動する（`nitro-cloudflare-dev`によりD1/R2バインディングがローカルエミュレーションされる）

### 5.3 管理画面認証のローカルバイパス

環境判定（`NODE_ENV=development`等）により、管理画面ミドルウェアの認証チェックをスキップする実装とする。本番ビルドでは常にCloudflare Accessによる保護が有効であることを別途確認する（§8受け入れ基準）。

---

## 6. PRプレビュー環境の構成

### 6.1 初期セットアップ（一度きり）

1. Cloudflareダッシュボードで、対象のWorkerをGitHubリポジトリに接続する（Workers Builds）
2. `wrangler d1 create blog-cms-preview` でプレビュー用D1データベースを作成する
3. `wrangler r2 bucket create blog-cms-preview` でプレビュー用R2バケットを作成する
4. `wrangler.preview.jsonc` に上記のバインディングを設定する（`env.preview`は`deployConfig`と共存できないため使わない。`architecture.md` §11.1）
5. **【重要】** CI（`.github/workflows/preview.yml`）が `pnpm build` の直前に `cp wrangler.preview.jsonc wrangler.jsonc` を実行する設定になっていることを確認する。この手順を欠くと、プレビューが誤って本番のD1・R2バインディングを参照してしまう（`architecture.md` §11.3）
6. プレビュー環境用のシークレット（OpenAI APIキー等、本番と別のキーを推奨）を登録する

### 6.2 通常運用

- プルリクエストを作成すると、Workers Buildsが自動的にプレビューURLを発行し、PRへコメントとして投稿する（追加の手動操作は不要）
- プレビュー環境のD1マイグレーションは、GitHub Actionsで `wrangler d1 migrations apply DB --env preview --remote` を実行して同期する

---

## 7. シークレット管理

| 環境       | 管理方法                                                                                                                                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ローカル   | `.dev.vars`（`.gitignore`対象）。OTEL送信は無効化するため、Mackerel APIキーの設定は不要                                                                                                                              |
| プレビュー | `wrangler secret put --env preview` またはCloudflareダッシュボード。本番とは別のOpenAI APIキーを使用する。Mackerel APIキーは本番と共通でよい（`deployment.environment`属性で区別するため）                           |
| 本番       | `wrangler secret put --env production` またはCloudflareダッシュボード。可能であればAI GatewayのBYOK機能でCloudflare側に一元管理する（`architecture.md` §14）。Mackerel APIキー（`MACKEREL_API_KEY`）もここで登録する |

---

## 8. 監視・可観測性（確定）

### 8.1 方針

OpenTelemetry（OTEL）で計装し、Mackerelへエクスポートする。Mackerelの従来のホスト型監視（エージェントを常駐させる方式）はサーバーレスのCloudflare Workersには馴染まないため対象外とし、MackerelがOTLP経由で提供するラベル付きメトリック・トレース・ログの機能を利用する。

### 8.2 技術選定

| 項目                      | 選定                                                  |
| ------------------------- | ----------------------------------------------------- |
| Workers側の計装ライブラリ | `@microlabs/otel-cf-workers`                          |
| 送信先エンドポイント      | `https://otlp-vaxila.mackerelio.com`（OTLP/**HTTP**） |
| 認証                      | `Mackerel-Api-Key`ヘッダーにWrite権限のAPIキーを設定  |

**HTTPエンドポイントを使う理由**：MackerelのOTLPエンドポイントはgRPC版（`otlp.mackerelio.com:4317`）とHTTP版（`https://otlp-vaxila.mackerelio.com`）の両方があるが、Cloudflare WorkersのランタイムはネイティブのgRPCクライアントを持たないため、HTTP版を使用する。

**ライブラリを使う理由**：Cloudflare自体にも「Workers自動トレーシング」というダッシュボードから設定できるネイティブのOTLPエクスポート機能があるが、本書執筆時点（2026年8月）でオープンベータであり、Mackerel固有の認証ヘッダー（`Mackerel-Api-Key`）を指定できるかは未確認である。`@microlabs/otel-cf-workers`は任意のヘッダーを指定できることが確認できているため、こちらを採用する。将来的にCloudflareネイティブ機能が成熟すれば、ライブラリを外して移行することも選択肢になる（§10オープンな論点）。

### 8.3 収集するテレメトリー

- **トレース**：リクエスト単位の自動計装（`instrument()`ラッパー）に加え、D1クエリ・R2操作・AI Gateway呼び出し（OpenAI API呼び出しのレイテンシ）にカスタムスパンを追加する
- **ログ**：`console.log`等の出力をトレースIDと相関させて送信する（Mackerelのログ機能。本書執筆時点でベータ）
- スパン数を増やしすぎない（単純なインメモリ処理にはスパンを作らない）方針とし、Workersの実行時間オーバーヘッドを抑える

### 8.4 環境ごとの扱い

- 本番・プレビュー環境ともに有効化する。同一のMackerel APIキーを使い、OpenTelemetryのリソース属性（`deployment.environment: production` / `preview`）でMackerel上の表示を区別する
- ローカル開発環境では送信を無効化する（環境変数でオン/オフを切り替える）

### 8.5 送信タイミング

Workersの`ctx.waitUntil()`を用いて、レスポンス送信後にバックグラウンドでエクスポートする（`@microlabs/otel-cf-workers`が内部的に行う）。ユーザーへの応答速度には影響しない。

---

## 9. 受け入れ基準

- [ ] ローカルで `nuxi dev` が起動し、D1・R2のローカルエミュレーションにアクセスできる
- [ ] ローカル環境では管理画面に認証なしでアクセスできる
- [ ] 本番環境の `/admin/*` `/api/admin/*` がCloudflare Accessで保護されている（未認証アクセスがブロックされる）
- [ ] プルリクエストを作成すると、自動的にプレビューURLが発行されPRにコメントされる
- [ ] Workers Buildsの非本番ブランチデプロイコマンドが `--env preview` 付きで設定されており、プレビュー環境が誤って本番D1・R2を参照していないことを確認している
- [ ] プレビュー環境が本番のD1・R2・OpenAI APIキーに一切触れない
- [ ] プレビュー環境全体（公開ページ含む）がCloudflare Accessで保護され、未認証アクセスがブロックされる
- [ ] D1 Time Travelでの復元手順を一度実際に試し、動作を確認している
- [ ] Mackerelのダッシュボードで、本番へのアクセスに対応するトレース・ログが確認できる
- [ ] プレビュー環境のテレメトリーが`deployment.environment: preview`として本番と区別して表示される
- [ ] ローカル開発時にはOTEL送信が発生しないことを確認している

---

## 10. 決定事項・未決事項

**壁打ちを通じて決定した事項**

| 項目                                  | 決定                                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| バックアップ方針                      | D1はTime Travelのみ、R2は当面なし（`architecture.md` §13で決定済み）                                                                                     |
| ローカルでの認証                      | 無条件にバイパスする                                                                                                                                     |
| プレビュー環境のデータ分離            | 本番と別のD1・R2・APIキーを使用する                                                                                                                      |
| プレビュー環境の認証保護              | 公開ページを含めた全体をCloudflare Accessで保護する（Worker単位のAccessポリシー、「プレビューデプロイのみ」スコープを使用）                              |
| Cloudflare AccessのIdP                | Cloudflareアカウントログイン（2026-08-28変更、当初案はGoogleアカウント連携だったが運用の単純さを優先しユーザー判断で変更）                              |
| Cloudflare Accessのセッション有効期間 | 24時間                                                                                                                                                   |
| Backblaze B2導入検討のトリガー        | R2の容量が1GBを超えたら検討を開始する                                                                                                                    |
| 監視・可観測性の方式                  | OpenTelemetry（`@microlabs/otel-cf-workers`）でMackerelへエクスポートする。エンドポイントはOTLP/HTTP版（`https://otlp-vaxila.mackerelio.com`）を使用する |

**未決事項**

1. Cloudflareネイティブの「Workers自動トレーシング」（オープンベータ）がMackerel固有の認証ヘッダーに対応した場合、ライブラリ方式からの移行を検討するか
