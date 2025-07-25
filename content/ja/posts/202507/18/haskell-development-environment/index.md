---
title: "Haskell開発環境構築メモ"
date: 2025-07-18
tags: ["Haskell"]
description: "知識ゼロから新しくHaskellの勉強をスタートできるようになるための環境構築の手順まとめ。開発ツールの導入、自動フォーマット、（疑似）ホットリロードまで対応した。"
keywords: ["Haskell", "開発環境"]
---

ずっと昔から Haskell や関数プログラミングのスキルを身につけることに憧れ（かっこいいよね）があり、以前（多分 10 年くらい前だ）実際に勉強したこともあるのだけど途中で飽きて放置してしまったことがある。あの時と違って今なら AI があるので、再びチャレンジするのにちょうどいいタイミングなのではと思い、まずは開発環境の構築から始めたいと思い、構築手順のメモを残すことにした。

今回は勉強だけで終わらせず実践したいので Web アプリケーションの開発に取り組みたいと考えている。そのためサンプルコードとして Servant を使った Web API を動かせるようにするところまでを目的とする。またエディタで効率的に開発できるようにするための周辺環境も同時に構築する。

## Haskell 開発ツール群の基礎知識

Haskell 周りでよく使われる標準的なツールのことを何もわかっていないのでまずはそこから押さえていく。まずはコンパイラについて。これは`GHC`というものを使う。コンパイラの選択肢は実質これ一択であると考えて良さそうだ。次にビルドツールだが、大きく分けて`Cabal`と`Stack`というものがあるようだ。AI に環境構築させると`Stack`を使った設定が生成されることがあるが、より新しいのは`Cabal`であり、新しく環境を構築するなら`Cabal`を使う方が良い。

また各種ツールを統合管理するために`GHCup`を使うのが推奨されているようだ。これは`pyenv`や`nvm`のようなバージョンを切り替えて管理できるようなツールの Haskell 版である。というわけでまとめると、現在の推奨構成は以下のようになる。

| ツール    | 役割               | 説明                                       |
| --------- | ------------------ | ------------------------------------------ |
| **GHCup** | ツールチェーン管理 | GHC、Cabal、HLS 等を統合管理               |
| **GHC**   | コンパイラ         | Haskell コードを機械語に変換               |
| **Cabal** | ビルドシステム     | プロジェクトのビルド・依存関係管理         |
| **HLS**   | 言語サーバー       | エディタでの補完・型チェック・フォーマット |

## Haskell ビルド環境構築手順

自分が Mac を使うので Mac を前提とします。

Haskell はコンパイルの際に裏で C コンパイラを使う。Mac では通常`clang`を使うが、Command Line Tools をインストールしていればすでにインストールされているはず。インストールされていない場合は下記のコマンドでインストールをする。

```text
xcode-select --install
```

前提環境が整ったので、ここからビルド環境を構築していく。まずは GHCup をインストールする。

```text
# GHCupインストール（推奨ツールを同時インストール）
curl --proto '=https' --tlsv1.2 -sSf https://get-ghcup.haskell.org | \
  BOOTSTRAP_HASKELL_NONINTERACTIVE=1 \
  BOOTSTRAP_HASKELL_GHC_VERSION=9.10.1 \
  BOOTSTRAP_HASKELL_CABAL_VERSION=3.14.1.0 \
  BOOTSTRAP_HASKELL_INSTALL_HLS=1 sh
```

インストール後は ghc コマンドを使えるようにパスを通しておく。

```text
# PATH追加
echo 'export PATH="$HOME/.ghcup/bin:$PATH"' >> ~/.zshrc
# シェル設定の更新
source ~/.zshrc
# インストール確認
ghc --version     # 9.10.1が表示されることを確認
cabal --version   # 3.14.1.0が表示されることを確認
```

次にプロジェクトを作る。適当なディレクトリを作成して`cabal init`を実行する（haskell-api の箇所は任意の名前で良い）。

```text
# プロジェクトディレクトリ作成
mkdir haskell-api
cd haskell-api

# Cabalプロジェクトの初期化
cabal init --non-interactive \
           --package-name=haskell-api \
           --version=1.0.0 \
           --language=GHC2024 \
           --application-dir=app \
           --source-dir=src
```

実行後、以下のようなディレクトリ構成が作成されている。

```text
$ tree .
.
├── app
│   └── Main.hs
├── CHANGELOG.md
└── haskell-api.cabal
```

`haskell-api.cabal`はプロジェクトのビルド設定ファイルで、依存関係やコンパイルオプションなどが記述されている。Node.js の`package.json`のようなものだと考えればよい。このファイルを編集し使用するライブラリなどの依存関係を追加する。なお、`npm install`のような自動で追記してくれる仕組みはない。

```text
cabal-version: 3.0
name: haskell-api
version: 1.0.0
synopsis: haskell api example
build-type: Simple

library
    exposed-modules: Api
    build-depends:
        base >=4.20.0.0 && <4.21,
        text >=2.1 && <2.2,
        aeson >=2.2.3.0 && <2.3,
        servant >=0.20.2 && <0.21,
        servant-server >=0.20.2 && <0.21,
        warp >=3.4.1 && <3.5
    hs-source-dirs: src
    default-language: GHC2024
    ghc-options: -Wall

executable haskell-api
    main-is: Main.hs
    build-depends:
        base >=4.20.0.0 && <4.21,
        haskell-api,
        servant >=0.20.2 && <0.21,
        servant-server >=0.20.2 && <0.21,
        warp >=3.4.1 && <3.5
    hs-source-dirs: app
    default-language: GHC2024
    ghc-options: -Wall -threaded -rtsopts -with-rtsopts=-N

test-suite haskell-api-test
    type: exitcode-stdio-1.0
    hs-source-dirs: test
    main-is: Spec.hs
    build-depends:
        base >=4.20.0.0 && <4.21,
        haskell-api,
        hspec >=2.11.9 && <2.12
    default-language: GHC2024
    ghc-options: -Wall -threaded -rtsopts -with-rtsopts=-N
```

さらに`cabal.project`ファイルを作成して、コンパイラのバージョン指定や最適化の設定などを記述しておく。

```text
packages: .

-- コンパイラバージョンの指定
with-compiler: ghc-9.10.1

-- ビルド設定
tests: True
optimization: True
jobs: $ncpus

-- 開発時警告設定
package *
  ghc-options: -Wall -Wcompat -Wredundant-constraints
```

ここからソースコードの作成に入る。以下のファイル群を作成していく。

**src/Api.hs** - API 定義

```haskell
{-# LANGUAGE DataKinds #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE TypeOperators #-}
{-# LANGUAGE OverloadedStrings #-}

module Api where

import Data.Aeson (ToJSON)
import Data.Text (Text)
import GHC.Generics (Generic)
import Servant

-- データ型定義
data Message = Message
  { content :: Text
  , author :: Text
  } deriving (Eq, Show, Generic)

instance ToJSON Message

-- API型定義
type MessageAPI = "messages" :> Get '[JSON] [Message]

-- サンプルデータ
sampleMessages :: [Message]
sampleMessages =
  [ Message "Hello, Haskell!" "Alice"
  , Message "Servant is great!" "Bob"
  ]

-- ハンドラー実装とAPI定義
messageAPI :: Proxy MessageAPI
messageAPI = Proxy

server :: Server MessageAPI
server = return sampleMessages
```

**app/Main.hs** - アプリケーションエントリポイント

```haskell
module Main where

import Network.Wai.Handler.Warp (run)
import Servant

import Api

main :: IO ()
main = do
  putStrLn "🚀 Haskell APIサーバーを起動中..."
  putStrLn "📍 http://localhost:8080"
  run 8080 (serve messageAPI server)
```

**test/Spec.hs** - テストスイート

```haskell
module Main where

import Test.Hspec

main :: IO ()
main = hspec $ do
  describe "基本的なテスト" $ do
    it "加算が正しく動作する" $
      2 + 2 `shouldBe` 4

    it "リストの長さが正しい" $
      length [1, 2, 3] `shouldBe` 3
```

アプリケーションが実装できたのでビルドして実行する。

```text
# 依存関係更新とビルド
cabal update
cabal build

# テスト実行
cabal test

# 依存関係のバージョンを固定（推奨）
cabal freeze

# アプリケーション起動
cabal run haskell-api
```

`cabal freeze`を実行すると`cabal.project.freeze`ファイルが生成される。このファイルには依存関係の具体的なバージョンが記録されており、Node.js の`package-lock.json`と同じ役割を持つ。これによりチーム開発で全員が同じバージョンの依存関係を使用でき、再現可能なビルドが保証される。

ブラウザから `http://localhost:8080/messages` にアクセスしてメッセージが表示されれば OK。

## VS Code 統合設定

まずは Haskell の拡張機能をインストールする。拡張機能の一覧で Haskell で検索して一番上に出てくるはずである（haskell.haskell という名前の拡張機能が見つかる）。そして`.vscode/settings.json`に下記の内容を設定する。

```json
{
  "haskell.formattingProvider": "fourmolu",
  "haskell.manageHLS": "GHCup",
  "haskell.serverExecutablePath": "/Users/$USER/.ghcup/bin/haskell-language-server-wrapper",
  "haskell.checkProject": true,

  "haskell.plugin.fourmolu.config.external": false,
  "haskell.plugin.hlint.diagnosticsOn": true,
  "haskell.plugin.eval.globalOn": true,

  "[haskell]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "haskell.haskell",
    "editor.tabSize": 2
  }
}
```

フォーマッターとして`fourmolu`を指定している。他のフォーマッターもあるが、現時点でこれがデファクトらしいのでこれを使う。明示的なインストールはしていないが HLS（Haskell Language Server）に内蔵されているので問題はない（HLS は`ghcup`で GHC をインストールした際に同時にインストール済み）。

HLS が起動していればファイル保存時に自動でフォーマットが行われる。HLS の起動確認は VS Code の Output パネルで Haskell を選択して表示される内容で確認できる。起動していない場合は VS Code の再起動や、**Cmd + Shift + P**でコマンドパレットを開き`Haskell: Restart Haskell LSP Server`を実行してみると良い。

## （疑似的な）ホットリロード対応

Web アプリケーション開発では、コードを変更するたびにコンパイルエラーを確認するのは面倒である。Haskell では`ghcid`というツールを使ってファイル変更を監視し、自動的にコンパイル、再起動を行うことが可能。本来のホットリロードはアプリケーションを停止させずに、という意味なので、ここでは疑似的と表現している。

まず`ghcid`をインストールする。これは開発ツールなのでグローバルにインストールする。

```text
cabal install ghcid
```

インストール後、`~/.cabal/bin/ghcid`にバイナリが作成されるため、PATH を通しておく。

そしてプロジェクトのルートディレクトリで以下のコマンドを実行する。

```text
ghcid \
  --command="cabal repl exe:haskell-api" \
  --test=":main" \
  --restart="src" \
  --restart="app"
```

これで以下の動作が実現される：

- **ファイル監視**: `src/`や`app/`内の Haskell ファイルを監視
- **自動ビルド**: ファイル変更時に自動的にコンパイル
- **サーバー再起動**: main を再実行してサーバーを再起動する
