---
title: check-metaプラグインをアップデートしました（v0.1.0）
date: '2020-01-20T05:52:10+00:00'
path: /posts/release-check-meta-v0.1.0/
description: '先日公開したcheck-metaプラグインをアップデートしました。'
tags:
  - Mackerel
---

先日公開したcheck-metaプラグインをアップデートしました。

<div class="iframely-embed"><div class="iframely-responsive" style="height: 140px; padding-bottom: 0;"><a href="https://tuka.io" data-iframely-url="//cdn.iframe.ly/MF7EN7o"></a></div></div><br/>

現時点で最新版の`v0.1.0`では以下のオプションに対応しました。

- 正規表現での比較（メタデータが文字列の場合）
- 数値の大小比較（メタデータが数値の場合）
- メタデータ同士の比較

それぞれさらっとご紹介です。

<br/>

## 正規表現での比較（メタデータ値が文字列の場合）

`v0.0.1`ではメタデータの値が文字列型の場合は`--expected`で指定した文字列との等価比較をしてましたが、`--regex`オプションを有効にすると正規表現としてマッチを行うようにしました。

```bash{5}:title=Usage
Application Options:
  -n, --namespace=NAMESPACE            Uses the metadata for the specified namespace
  -k, --key=KEY                        The value matching the specified key is used for comparison
  -e, --expected=EXPECTED-VALUE        Compares with the specified expected value
      --regex                          Compare with regular expression if specified (Enable only for string type value)
 :
```

`--regex`オプションはメタデータの値が文字列以外の場合は作用しません。

（指定してもエラーになりません）

<br/>

設定例はこんな感じ。

```bash:title=mackerel-agent.conf
# GET /api/v0/hosts/<hostId>/metadata/namespace
# {
#   "key1": "value1",
#    :
# }
[plugin.checks.meta_match_regex]
command = ["/path/to/check-meta", "--namespace", "namespace", "--key", "key1", "--expected", "value[0-9]{1}", "--regex"]
```

`check-log`や`check-procs`などは`--pettern`に正規表現を指定する形式なのに対し、必要な時にだけ正規表現として作用させるためにあえてフラグという選択をしました。

<br/>

## 数値の大小比較（メタデータ値が数値の場合）

メタデータの値が数値型（JSONのnumber）の場合、`actual`を左辺、`expected`を右辺として大小比較するフラグオプションを追加しました。

```bash{3-6}:title=Usage
Application Options:
 :
    --gt   Compare as 'actual > expected' (Enable only for number type value)
    --lt   Compare as 'actual < expected' (Enable only for number type value)
    --ge   Compare as 'actual >= expected' (Enable only for number type value)
    --le   Compare as 'actual <= expected' (Enable only for number type value)
 :
```

設定例はこんな感じ。

```bash:title=mackerel-agent.conf
# GET /api/v0/hosts/<hostId>/metadata/namespace
# {
#   "key1": "value1",
#   "key2": 1000,
#    :
# }
[plugin.checks.meta_match_regex]
command = ["/path/to/check-meta", "--namespace", "namespace", "--key", "key2", "--expected", "1000", "--le"]
```

比較オプションを複数指定した場合はエラーとなります。`n以上、m以下`の様な条件指定は現時点では非対応です。

<br/>

## メタデータ同士の比較

メタデータ同士の比較に対応しました:sparkles:

このプラグインに必要だなと真っ先に思った機能がメタデータ同士の比較でした。

オプションはこんな感じ。

```bash{3-4}:title=Usage
Application Options:
 :
  -N, --compare-namespace=NAMESPACE    Uses the metadata for the specified namespace to compare
  -K, --compare-key=KEY                Uses the metadata value that matches the specified key as the expected value
```

比較に用いるメタデータのnamespaceとJSONのキーを指定し、メタデータ同士が同じ型ではない場合はエラーとなります。

またいずれかのオプションが指定されなかった場合は、`actual`な値のnamespaceもしくはJSONのキーを使用します。

リポジトリのREADMEのExampleに設定例を載せていますが、以下のように`key1`と`key4`の値を比較する場合の定義はこのようになります。

```bash{10-11}:title=check-meta
# GET /api/v0/hosts/<hostId>/metadata/namespace
# {
#   "key1": "value1",
#    :
#   "key4": "value1",
# }
 :
## OK (compare with metadata)
[plugin.checks.meta_compare_metadata]
command = ["/path/to/check-meta", "--namespace", "namespace", "--key", "key1", "--compare-key", "key4"]
```

ちなみに前述の正規表現、数値の大小比較のオプションも組み合わせることが可能です。

チェック監視の条件は`mackerel-agent.conf`に書くものでしたが、このプラグインの面白いところはAPI経由で監視条件をある程度コントロールできるところかなと思います。

<br/>

## まとめ

ゆるゆるとバージョンアップを続けておりますが、オプションが増えて少し便利になったかなと思います。

しかしまだAPIとの疎通ができなかった場合などの考慮に対応できていないので、次のバージョンアップではそちらにも対応しようと思います。不具合などありましたらIssueください！

<br/>

メタデータが監視のみならず運用などにも使えるのではないか！と感じていただきつつ、活用していただけると！
