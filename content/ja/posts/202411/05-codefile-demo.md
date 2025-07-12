---
title: "codefile ショートコードの使い方"
tags: ["Hugo", "Shortcode", "Go"]
description: "実際のソースコードをビルド時に取り込む方法を紹介"
---

この記事では、`codefile` ショートコードを使って実際のリポジトリ内コードを記事内に展開する方法を説明します。

## 例：Go プログラム

以下のショートコードは `/examples/hello-go/main.go` を読み込み、シンタックスハイライト付きで表示します。

{{< codefile src="examples/hello-go/main.go" >}}

---

### 行番号で範囲指定の例（3〜5 行目）

{{< codefile src="examples/hello-go/main.go" lines="3-5" >}}
