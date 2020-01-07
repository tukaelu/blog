---
title: Windowsイベントログをコマンドプロンプト（PowerShell）から作成する
date: '2020-01-07T13:43:21+00:00'
path: /posts/create-new-eventlog-on-windows/
description: 'WindowsイベントログをPowerShellで作成する備忘録です。'
tags:
  - windows
  - 備忘録
---

例えば以下の様な条件のイベントログを発生させたいとします。

- イベントの種類は`Application`
- イベントソースは`HogeSystem`
- イベントタイプは`Error`、イベントIDは`100`
- メッセージは`This is a test event of HogeSystem (ErrCode=100)`

その場合、PowerShellのコマンドレットで以下のような手順を踏む。

- イベントビューアにイベントソースを作成（New-EventLog）
- イベントソースに対してイベントログを書き込む（Write-EventLog）

実際のコマンドは以下のような感じ。

```powershell:title=PowerShell
New-EventLog -LogName Application -Source "HogeSystem"
Write-EventLog -LogName Application -Source "HogeSystem" -EntryType Error -EventID 100 -Message "This is a test event of HogeSystem (ErrCode=100)"
```

以下、コマンドレットのちょいメモ。

## New-EventLogコマンドレット

イベントビューアに新しいイベントログを作成する

| Option | Require | Description |
| ------ | ------- | ------------|
| -LogName | Y | イベントタイプ（種類）を指定（System, Application, など） |
| -Source | Y | イベントソースを指定 |
| -ComputerName | N | コンピュータ名を指定 |
| -ParameterResourceFile | N | メッセージパラメータが格納されているリソースファイル（DLL）のパスを指定 |

## Write-EventLogコマンドレット

Windowsイベントをログに記録する

| Option | Require | Description |
| ------ | ------- | ------------|
| -LogName | Y | 記録するイベントタイプ（種類）を指定（System, Application, など） |
| -Source | Y | 記録するイベントソースを指定 |
| -EventId | Y | 記録するイベントIDを指定 |
| -Message | Y | 記録するイベントのメッセージを指定 |
| -EntryType | N | 記録するイベントのレベルを指定 |
| -Category | N | 記録するイベントのタスクのカテゴリーを指定 |
| -ComputerName | N | イベントを記録するコンピュータ名を指定 |

[Mackerel](https://mackerel.io/) の [check-windows-eventlog](https://github.com/mackerelio/go-check-plugins/tree/master/check-windows-eventlog) プラグインの設定確認をする際に覚えておくと非常に便利！
