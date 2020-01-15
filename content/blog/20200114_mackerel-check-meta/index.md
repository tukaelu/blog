---
title: Mackerelのホストメタデータをチェックするプラグインを作った
date: '2020-01-15T10:00:00+00:00'
path: /posts/mackerel-check-meta/
description: 'Mackerelのホストメタデータをチェックするプラグインを工作したのでご紹介です。'
tags:
  - Mackerel
---

年明けに Mackerel のホストメタデータをチェックするプラグインを工作したのでご紹介です。

## TL;DR

- ホストに投稿されたメタデータをチェックするプラグインを作りました
- メタデータは Mackerel API から更新できるので、監視結果を外部から操作できます
- チェック監視の `action` と組み合わせると色々とできるかもしれません

## Mackerel におけるプラグインとは…

そもそもの話ですが Mackerel には監視機能を拡張するためのプラグイン機構があり、大きく3つの分類があります。

- メトリックプラグイン
  - OSやミドルウェアなどのメトリックを収集するプラグイン
- チェックプラグイン
  - ホストの状態（例えばプロセスの状態やログの内容など）をチェックして結果を返却するプラグイン
- メタデータプラグイン
  - ソフトウェアのバージョンなどの任意のデータをJSON形式で出力するプラグイン

メトリックプラグイン、チェックプラグインは主に監視に用いられるデータを、メタデータプラグインは Mackerel をレジストリとして登録するデータを扱うためのプラグインです。
そしてそれらのデータを mackerel-agent が Mackerel API への投稿を代理する仕組みになっています。

Mackerel ユーザーの方であればメトリックプラグイン、チェックプラグインは公式提供されているものがあるので、ご存知だったりすでにご利用いただいている方もいらっしゃるかと思います。

しかしメタデータプラグインは登録するためのインタフェースは用意されているのですが公式に提供しているものはなく、まだまだ機能としての認知度は低いですかね... :expressionless:

## Mackerelのメタデータとは…

繰り返しになりますが Mackerel をレジストリ的に扱うための便利な機能で、ホスト/ロール/サービスに対してJSON形式のデータをAPI経由で投稿できます。

<iframe src="https://hatenablog-parts.com/embed?url=https%3A%2F%2Fmackerel.io%2Fja%2Fapi-docs%2Fentry%2Fmetadata" style="border: 0; width: 100%; height: 190px;" allowfullscreen scrolling="no"></iframe>

ホストメタデータについては以下のページにあるように mackerel-agent の設定で簡単に扱えます！

<iframe src="https://hatenablog-parts.com/embed?url=https%3A%2F%2Fmackerel.io%2Fja%2Fdocs%2Fentry%2Fhowto%2Fmetadata" style="border: 0; width: 100%; height: 190px;" allowfullscreen scrolling="no"></iframe>

レジストリとして扱える点などからAnsibleやCapistranoといった各種自動化ツールと組み合わせることができる有用な機能のひとつなのではないかと思ってます！

## 作ったもの

そんなメタデータのうち、ホストに投稿されたメタデータの値をチェック監視するプラグインを実装しました。

<div class="iframely-embed"><div class="iframely-responsive" style="height: 140px; padding-bottom: 0;"><a href="https://github.com/tukaelu/check-meta" data-iframely-url="//cdn.iframe.ly/t6Yiox5"></a></div></div><br/>

利用するには、メタデータの監視をしたいホストにプラグインをインストールする必要があります。

ホストにログインして以下のコマンドを実行することで簡単にインストールできます。（mkrコマンドが必要です）

```bash:title=Install
sudo mkr plugin install tukaelu/check-meta
```

以下はプラグインのUsageですが、以下のようなオプションが指定できます。

```bash:title=Usage
Usage:
  check-meta [OPTIONS]

Application Options:
  -n, --namespace= Uses the metadata for the specified namespace
  -k, --key=       The value matching the specified key is used for comparison
  -e, --expected=  Compares with the specified expected value

Help Options:
  -h, --help       Show this help message
```

メタデータはnamespace（名前空間）に対してJSONを登録することになるので、例えば `hoge` という名前空間に以下のようなメタデータを登録していたとします。

```json:title=metadata
# GET /api/v0/hosts/<hostId>/metadata/hoge
{
  "foo" : "foo-value",
  "bar" : "bar-value",
   :
}
```

このメタデータの `foo` というキーに対する値が `foo-value` にであるかチェックするには以下のような指定をします。

```bash:title=mackerel-agent.conf
[plugin.checks.meta-hoge-foo]
command = ["/path/to/check-meta", "--namespace", "hoge", "--key", "foo", "--expected", "foo-value"]
```

メタデータにはオブジェクト、配列、文字列、数値、真偽値、Nullを登録できますが、リリースした `v0.0.1` では文字列、数値、真偽値に対応しています。

`--expected` に指定する値はメタデータに登録した値の型に併せて文字列、数値、真偽値を指定してください。型が一致しない場合などは`UNKNOWN`となります。

## 便利な使い方

`check-meta` はチェックプラグインなので、もちろんチェック監視の結果に応じて任意のコマンドを実行できます。

<iframe src="https://hatenablog-parts.com/embed?url=https%3A%2F%2Fmackerel.io%2Fja%2Fblog%2Fentry%2Fweekly%2F20171027" style="border: 0; width: 100%; height: 190px;" allowfullscreen scrolling="no"></iframe>

既存のチェックプラグインではサーバー内部の状態をチェックするものが多いですが、APIを介して外部からメタデータを更新できるというところがポイントだったりします :bulb:

例えば `state` というキーの値（bool）が `true` であることを監視し、不一致の場合に任意のコマンドを実行する設定は以下のようになります。

```bash:title=mackerel-agent.conf
[plugin.checks.meta-hoge-foo]
command = ["/path/to/check-meta", "--namespace", "hoge", "--key", "state", "--expected", "true"]
check_interval = 5
action = { command = "bash -c '[ \"$MACKEREL_STATUS\" != \"OK\" ]' && /path/to/do_something"}
```

この `state` を外部から更新することで、任意のタイミングでコマンドを実行させることが可能です。（実行されるまでに時間差はあります）

`action` を利用する際の注意点としてメタデータが更新されない限りは繰り返しコマンドを実行してしまうので、
`do_something` の処理の中でメタデータを正しい値に更新する必要があります。
（チェックプラグインという観点から `check-meta` 自体にメタデータの更新処理は備えていません）

また `check_interval` で監視間隔に余裕を持たせるなどの考慮も必要かもしれませんね。

## 最後に

まだ基本的なチェックしか実装してないですが、メタデータ同士の値をチェックする機能や数値の大小比較など拡張していけたらと思います。

その他、アイデアやこうしたほうがいい的なIssueやPRをお待ちしております！

また感想もtwitterとかで貰えるとっ :pray:
