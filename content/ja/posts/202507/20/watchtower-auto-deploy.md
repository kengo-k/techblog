---
title: "watchtowerでローカルアプリケーションを自動デプロイする"
date: 2025-07-20
tags: [DevOps]
description: "自宅のQNAP Container Station上のコンテナアプリケーションを自動デプロイするためのメモです"
toc: false
draft: true
---

ひょんなことから `watchtower` なるツールがあることを知った。どうやらコンテナレジストリを監視して新しいイメージを検出すると自動で再デプロイしてくれるツールらしい。自分は自宅で QNAP という NAS を使っているが、この NAS は Container Station というアプリが使えて、簡単に NAS 上で Docker コンテナを動かすことができる。私は Container Station 上で人に見せる前提ではない自分のためだけのアプリケーションをいくつか運用している。

正直、今時は Vercel なんかを使えば GitHub に push するだけで自動デプロイできるから、あまり需要はないかもしれない。とはいえ、なんでもかんでも公開したい人ばかりでもないはず。これを使えば自宅でも git push のみで簡単デプロイできて便利だなと思った。もしかしたら役に立つ人がいるかもしれないから一応メモとして残しておく。

なお`watchtower`は公式がホームラボのようなローカル環境で利用することを推奨しており、基本的に本番環境で利用することは避けた方がよさそうです。

## 全体の流れ

今回の自動デプロイの仕組みは以下のような流れになる：

1. GitHub 上でアプリケーションを開発する
2. GitHub Actions でワークフローを定義し、マージ時にイメージをビルド＆GitHub Container Registry (GHCR) に Push する
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

express を使用したシンプルな API サーバー。pacakge.json は下記。

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

GitHub Actions のワークフローを作成して、コードが push されたときに自動でイメージをビルド・プッシュするように設定する。

**.github/workflows/build.yaml** :　ファイル名の部分（build.yaml） は任意です。ディレクトリは固定。

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
        with:
          config-inline: |
            [registry."192.168.1.120"]
              http = true
              insecure = true

      - name: Log in to Gitea Package Registry
        uses: docker/login-action@v2
        with:
          registry: 192.168.1.120
          username: ${{ github.actor }}
          password: ${{ secrets.PACKAGES_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            192.168.1.120/${{ github.repository_owner }}/simple-api-server:latest
            192.168.1.120/${{ github.repository_owner }}/simple-api-server:${{ github.sha }}
```

GitHub リポジトリ上での作業は以上で終了となる。main ブランチに上記の内容が PUSH されたタイミングでワークフローが実行される。すると Dockerfile に記述されたイメージがビルドされ、そのイメージは GHCR に PUSH される。

GitHub の`Packages`タブにビルドしたイメージが登録されていれば成功である。

## 3. Container Station でのデプロイ

ここまで来たらデプロイの準備が整っているので、自宅の Container Station にアプリをデプロイしよう。

まず、QNAP 上で GHCR にログインしておく必要がある。GHCR はプライベートリポジトリの場合は認証が必要になる。QNAP に SSH でログインして以下のコマンドを実行する：

```bash
docker login ghcr.io -u ユーザー名 -p 個人アクセストークン
```

個人アクセストークンは GitHub の Settings → Developer settings → Personal access tokens から `read:packages` 権限で作成できる。

ログインが完了したら、Container Station に下記の内容で docker-compose.yaml を入力する。

```yaml
version: "3.8"

services:
  app:
    image: 192.168.1.120/apps/simple-api-server:latest
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
      # コンテナにレジストリ認証情報を渡す（docker login 済みが前提）
      - ~/.docker/config.json:/root/.docker/config.json:ro
    command: >
      --cleanup           # 古いイメージを自動削除
      --interval 30       # 30 秒間隔でポーリング
      simple-api-server   # 監視対象コンテナ名
```

ポイントは QNAP ホスト上の Docker デーモンを利用するために volumes で Docker ソケットをマウントしているところです。また command では監視対象のコンテナ名を指定しています。

上記の内容で Container Station でアプリを作成し、コンテナ(app コンテナと watchtower コンテナ)が起動すれば成功です。

## 動作確認とまとめ

設定が完了したら、実際に自動デプロイが動作するか確認してみよう。適当にアプリのソースコードを編集して GitHub に PUSH してみる。ワークフローが起動し 新しいイメージが GHCR に PUSH されると、watchtower コンテナが自動で app コンテナを最新イメージでデプロイしてくれる。

これで git push するだけで自宅の Container Station 上のアプリが自動更新される仕組みが完成した。Vercel のような外部サービスを使わずに、自宅環境でも手軽に自動デプロイが実現できるようになった。
