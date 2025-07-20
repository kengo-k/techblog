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

## 基本的な手順

- GitHub 上でアプリケーションを開発する
- GitHub Actions でワークフローを定義し、マージ時にイメージをビルド＆イメージレジストリに Push
- Container Station に docker-compose.yml を使用してアプリを作成

## コード例

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

express を使用したシンプルな API サーバーです。pacakge.json は下記の内容です。

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

続いて GitHub Actions のワークフローを下記の内容で作成する。

**.github/workflows/build.yaml** :　(build.yaml の部分の名前は任意です。ディレクトリは固定)

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

GitHub リポジトリ上での作業は以上で終了となる。main ブランチに上記の内容が PUSH されたタイミングでワークフローが実行され、Dockerfile に記述されたイメージがビルドされ、そのイメージはイメージリポジトリに PUSH される。

GitHub の`Packages`タブにビルドしたイメージが登録されていれば成功である。

ここまで来たらデプロイの準備が整っているので、自宅の Container Station にアプリをデプロイしよう。Container Station で下記の内容で docker-compose.yaml を入力する。

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
      # ホスト側 Docker デーモンと通信
      - /var/run/docker.sock:/var/run/docker.sock
      # レジストリ認証情報を中に渡す（docker login 済みが前提）
      - ~/.docker/config.json:/root/.docker/config.json:ro
    command: >
      --cleanup           # 古いイメージを自動削除
      --interval 30       # 30 秒間隔でポーリング
      simple-api-server   # 監視対象コンテナ名
```

ポイントは QNAP ホスト上の Docker デーモンを利用するために volumes で Docker ソケットをマウントしているところです。また command では監視対象のコンテナ名を指定しています。

上記の内容で Container Station でアプリを作成し、コンテナ(app コンテナと watchtower コンテナ)が起動すれば成功です。このあとで、適当にアプリのソースコードを編集して PUSH してみよう。GitHub 上で新しいイメージがイメージレジストリに PUSH されると、watchtower コンテナが自動で app コンテナを最新イメージでデプロイしてくれる。
