---
title: "watchtowerでローカルアプリケーションを自動デプロイする"
date: 2025-07-25
tags: [DevOps, QNAP]
description: "自宅のQNAP Container Station上のコンテナアプリケーションを自動デプロイするためのメモです"
keywords: ["watchtower", "Docker", "自動デプロイ", "QNAP", "DevOps"]
toc: false
---

ひょんなことから `watchtower` なるツールがあることを知った。どうやらコンテナレジストリを監視して新しいイメージを検出すると自動で再デプロイしてくれるツールらしい。私は自宅で QNAP という NAS を使っているのだが、この NAS では Container Station というアプリが使えて、簡単に NAS 上で Docker コンテナを動かすことができる。私は Container Station 上で人に見せる前提ではない自分のためだけのアプリケーションをいくつか運用している。

正直、今時は Vercel なんかを使えば GitHub に push するだけで自動デプロイできるから、あまり需要はないかもしれない。とはいえ、なんでもかんでも公開したい人ばかりでもないはずで、これを使えば自宅でも git push のみで簡単デプロイできて便利だなと感じた。もしかしたら役に立つ人がいるかもしれないから一応メモとして残しておく。

なお`watchtower`は公式がホームラボのようなローカル環境で利用することを推奨しており、基本的に本番環境で利用することは避けた方がよさそう。

## 全体の流れ

今回の自動デプロイの仕組みは以下のような流れになる：

1. GitHub 上でアプリケーションを開発する
2. GitHub Actions でワークフローを定義し、main へのマージ時にイメージをビルド＆GitHub Container Registry (GHCR) に Push
3. Container Station に docker-compose.yml を使用してアプリを作成
4. Container Station 上の watchtower コンテナが新しいイメージを検知して自動デプロイ

## 1. アプリケーション作成

まずアプリケーションについて。これはこの記事においては本題ではないので適当に作ってくれて構わないのだが、一応簡単な例を載せておく。

```js
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Hello, World!",
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

express を使用したシンプルな API サーバー。package.json は下記。

```json
{
  "name": "simple-api-server",
  "version": "1.0.0",
  "description": "Simple API server",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

続いてデプロイ用のイメージを作成するための Dockerfile を下記の内容で作成する。

```Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

## 2. GitHub Actions 設定

GitHub Actions のワークフローを作成して、コードが push されたときに自動でイメージをビルドし GHCR へ push するように設定する。

**.github/workflows/build.yaml** :　ファイル名の部分（build.yaml） は任意です。ディレクトリは固定。

```yaml
name: Build and Push Docker Image

on:
  push:
    branches:
      - main

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

GitHub リポジトリ上での作業は以上で終了となる。main ブランチに上記の内容が PUSH されたタイミングでワークフローが実行される。すると Dockerfile に記述されたイメージがビルドされ、そのイメージは GHCR に PUSH される。

GitHub の`Packages`タブにビルドしたイメージが登録されていれば成功である。

## 3. Container Station でのデプロイ

ここまで来たらデプロイの準備が整っているので、自宅の Container Station にアプリをデプロイしよう。

まず、Container Station 上で GHCR への認証情報を設定しておく必要がある。「レジストリ」メニューより「カスタムレジストリ」を追加する（デフォルトでは Docker Hub しか表示されていない）。

- URL: https://ghcr.io
- 認証: ON
- ユーザー名: GitHub アカウント名
- パスワード: アクセストークン

を設定しよう。アクセストークンは GitHub の Settings → Developer settings → Personal access tokens → Tokens(classic)よりトークンを作成し、 `read:packages` 権限を付与しておくこと。

カスタムレジストリの設定が完了したら、Container Station に下記の内容で docker-compose.yaml を入力する。

```yaml
version: "3.8"

services:
  app:
    image: ghcr.io/kengo-k/simple-api-server:latest
    container_name: simple-api-server
    restart: always
    ports:
      - "8888:3000" # ← アプリの LISTEN ポートに合わせて変更

  watchtower:
    image: containrrr/watchtower:latest
    container_name: watchtower
    restart: always
    volumes:
      # コンテナがホスト側 Docker デーモンと通信できるようにする
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - REPO_USER="your github account"
      - REPO_PASS="your github access token" # 上記で設定したトークンと同じトークンを設定
    command: >
      --cleanup           # 古いイメージを自動削除
      --interval 180      # 180 秒間隔でポーリング
      simple-api-server   # 監視対象コンテナ名
```

QNAP ホスト上の Docker デーモンを利用するために volumes で Docker ソケットをマウントしているところがポイント。また command では監視対象のコンテナ名を指定している。なお、Container Station 上で GHCR への認証情報を設定しているのに docker-compose.yaml （の watchtower コンテナの設定）でも認証情報を指定しているのが冗長に見えるが、これは

- Container Station が app コンテナ のイメージを取得する際に認証情報を使用する
- watchtower コンテナが app コンテナの最新イメージを取得する際に認証情報を使用する

という二か所でそれぞれ認証が必要になるためである。上記の内容で Container Station でアプリを作成し、コンテナ(app コンテナと watchtower コンテナ)が起動すれば成功です。

※ この docker-compose.yaml にはアクセストークンが記述されているため、絶対に **GitHub にコミットしてはならない**。

## 動作確認とまとめ

設定が完了したら、実際に自動デプロイが動作するか確認してみよう。適当にアプリのソースコードを編集して GitHub に PUSH してみる。ワークフローが起動し 新しいイメージが GHCR に PUSH されると、watchtower コンテナが自動で app コンテナを最新イメージでデプロイしてくれる（適当にアプリケーション内の文字列を変更して表示内容が更新されるか確認してみよう）。

これで git push するだけで自宅の Container Station 上のアプリが自動更新される仕組みが完成した。Vercel のような外部サービスではなくても、自宅で手軽に自動デプロイが実現できるようになった。
