---
title: check-metaプラグインをアップデートしました（v0.1.1）
date: '2020-02-02T00:33:53+00:00'
path: /posts/update-check-meta-v0.1.1/
description: 'check-meta プラグインをv0.1.1にバージョンアップしました。'
tags:
  - Mackerel
---

check-meta プラグインを`v0.1.1`にバージョンアップしました。

<div class="iframely-embed"><div class="iframely-responsive" style="height: 140px; padding-bottom: 0;"><a href="https://tuka.io" data-iframely-url="//cdn.iframe.ly/xvkN3OL"></a></div></div><br />

前回のアップデートで追加したメタデータ同士の比較オプションですが、
今回のアップデートで期待値（Expected）にメタデータを指定した場合は、その値をローカルにキャッシュを行います。

<br />

メタデータ同士を比較する際は、実際値（Actual）を取得→期待値（Expected）を取得→比較のような流れになります。
この取得した期待値をキャッシュして、次回のチェックの際に期待値が取得できない場合は直前にキャッシュした値を参照します。

<br />

キャッシュの保存先は環境変数`MACKEREL_PLUGIN_WORKDIR`に従いますが、未指定だと`/var/tmp/mackerel-agent/`などになります。
こちらの配下に`check-meta/check-meta-{ハッシュ文字列}.json`のようなファイルを作成してキャッシュします。

<br />

例えば以下のようなメタデータ同士を比較するとします。

<br />

```conf
# {
#   "status": "Mackerel",
#   "expect_status": "mackerel"
# }

[plugin.checks.meta_test]
command = ["check-meta", "-n", "foobar", "-k", "status", "-K", "expect_status"]
```

<br />
キャッシュの内容は以下のようになります。
<br /><br />

```json
$ cat /var/tmp/mackerel-agent/check-meta/check-meta-56a8b39277323c32b6aeb18b465f1190.json | jq
{
  "options": [
    "-n",
    "foobar",
    "-k",
    "status",
    "-K",
    "expect_status"
  ],
  "expected": "mackerel",
  "updated_at": 1580604720
}
```

<br />

`options`は使用している項目ではないですが、どの設定のキャッシュかがわかるように保存しています。通常は意識しないですかね。

`expected`が最新のメタデータの値、`updated_at`はキャッシュを保存した際のUNIXタイムスタンプです。
現時点ではキャッシュの有効期限チェックのオプションは設けていませんが、そんなオプションもゆるゆると追加していきます。
