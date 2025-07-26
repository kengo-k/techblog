---
title: "Container StationにGiteaをインストールする"
date: 2025-08-01
tags: ["QNAP"]
description: "QNAPのContainer StationにGiteaをインストールし、自宅Gitサーバーを構築した時のメモです"
keywords: ["QNAP", "Gitea", "Container Station", "Git", "自宅サーバー"]
toc: false
draft: true
---

前回に引き続き Container Station ネタ。今回は Container Station 上に Gitea をインストールしたので、その時の作業記録を残しておく。Gitea は Go 製の Git サーバで非常に軽量なのが特徴らしい。これまでは Git Bucket （これは Java 製）を使っていたのだが、Gitea に移行するだけで使用メモリが大幅に削減されること、さらに GitHub Actions 互換のワークフロー（Gitea Actions）を実行できるらしい。ちょうどブログをやり始めたこともあり、記録を残しつつ移行してみることにしました。

ゴールは Gitea Actions が動作すること、およびコンテナイメージを Gitea のコンテナレジストリに PUSH できるようにすることとします。

## 作業手順

1. Gitea をインストールする
1. Gitea Runner をインストールする
1. 動作確認

インストールは二つのアプリ（docker-compose.yaml） に分けて行うこととする。これは Gitea Runner に登録するトークンを事前に取得しておくため、先に Gitea をインストールする必要があるためです。

## Gitea のインストール

まず Gitea 本体のインストールのために、下記の docker-compose.yaml を作成する。

```yaml
version: "3.7"
services:
  gitea:
    image: gitea/gitea:1.21
    container_name: gitea_web2
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__database__DB_TYPE=postgres
      - GITEA__database__HOST=db:5432
      - GITEA__database__NAME=gitea
      - GITEA__database__USER=gitea
      - GITEA__database__PASSWD=gitea_password
      - GITEA__server__HTTP_PORT=80
      - GITEA__actions__ENABLED=true
      - GITEA__actions__DEFAULT_ACTIONS_URL=https://gitea.com
      - GITEA__packages__ENABLED=true
    networks:
      gitea_qnet:
        ipv4_address: 192.168.1.111
      internal_network:
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    container_name: gitea_db2
    environment:
      - POSTGRES_USER=gitea
      - POSTGRES_PASSWORD=gitea_password
      - POSTGRES_DB=gitea
    networks:
      - internal_network

networks:
  gitea_qnet:
    driver: qnet
    driver_opts:
      iface: "eth0"
    ipam:
      driver: qnet
      options:
        iface: "eth0"
      config:
        - subnet: 192.168.1.0/24
          gateway: 192.168.1.1
  internal_network:
    driver: bridge
```

上記の設定内容について、重要な箇所のみ補足しておく。まず、Actions とコンテナレジストリを有効化するために下記の設定は必須となる。

```yaml
- GITEA__actions__ENABLED=true
- GITEA__packages__ENABLED=true
```

これを入れておかないと、設定画面等に該当のメニューが表示されず使うことができない。

次にネットワーク関連の設定については、自宅のネットワーク（192.168.1.0）内の固定 IP を振るための設定（ブリッジ接続）をしている。この設定をしない場合は、QNAP ホストの IP を使ってポートフォワード経由でコンテナにアクセスすることになる。個人的な好みとして、（めんどくさいので）なるべくポート番号を指定したくないし、どのポートが使用中であるかの管理もしたくないので、基本的にブリッジ接続を使用することにしている。

コンテナ起動後に Web にアクセスすると、インストール画面が表示される。インストール後にユーザー登録をすると、下記画像のような TOP ページが表示されるはずである。

{{< img src="image1.png" quality="5" alt="Giteaの設定画面" >}}

右上のユーザーアイコンをクリックし「設定」メニューをクリックする。

{{< img src="image2.png" alt="Giteaの設定画面2" >}}

設定画面では、サイドバーにある「Actions」メニューより「ランナー」をクリックし、右上の「新しいランナーを作成」ボタンをクリックする。

{{< img src="image3.png" alt="Giteaの設定画面3" width="300">}}

トークンが表示されるので、このトークンをコピーしておくこと。

## Gitea Runner のインストール

下記の docker-compose.yaml を作成し、Gitea Runner をインストールする。

```yaml
version: "3.7"
services:
  gitea-runner:
    image: gitea/act_runner:latest
    container_name: gitea_runner2
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - GITEA_INSTANCE_URL=http://192.168.1.111
      - GITEA_RUNNER_REGISTRATION_TOKEN=Giteaの設定画面で取得した登録用トークン
    networks:
      gitea_runner_qnet:
        ipv4_address: 192.168.1.112
    restart: unless-stopped

networks:
  gitea_runner_qnet:
    driver: qnet
    driver_opts:
      iface: "eth0" # QNAPの物理インターフェース名に合わせて変更
    ipam:
      driver: qnet
      options:
        iface: "eth0"
      config:
        - subnet: 192.168.1.0/24 # ご自宅のLANサブネットに合わせて
          gateway: 192.168.1.1 # ご自宅ルーターのIP
```

`GITEA_RUNNER_REGISTRATION_TOKEN`に先ほど Gitea の設定画面で取得したトークンを設定すること。docker.sock をマウントしているのは Actions 内で docker コマンドを使うことを想定しているため。

コンテナが起動し、しばらく待つと下記のような表示になっているはずである。

{{< img src="image4.png" alt="Giteaの設定画面2" >}}

Gitea のランナー管理画面に新しいランナーが登録されていることが確認できた。うまくいかない場合はランナーコンテナのログを確認してみると、何かしらのエラーが表示されている可能性が高い。

## 動作確認

ここまでで必要な設定ができているはずなので、実際に動作確認をしてみる。Go の HelloWorld バイナリを埋め込んだ Docker イメージを Gitea のレジストリに登録できることを確認しよう。

ソースファイルは下記。

**hello.go**

```go
package main

import "fmt"

func main() {
	fmt.Println("Hello, World!")
}
```

**Dockerfile**

```Dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY main.go .
RUN go build -o hello main.go

# Runtime stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/hello .
CMD ["./hello"]
```

そして Gitea Actions を以下の内容で作成する。

**.gitea/workflows/build.yaml**

```yaml
name: Build and Push Docker Image

on:
  push:
    branches:
      - main

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        with:
          config-inline: |
            [registry."192.168.1.111"]
              http = true
              insecure = true

      - name: Login to Gitea Registry
        uses: docker/login-action@v3
        with:
          registry: 192.168.1.111
          username: ${{ gitea.actor }}
          password: ${{ secrets.CREATE_PACKAGES }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            192.168.1.111/${{ gitea.repository }}:latest
            192.168.1.111/${{ gitea.repository }}:${{ gitea.sha }}
```

Gitea のレジストリにログインする際は、パッケージへの書き込み権限を持ったトークン（上の例では`CREATE_PACKAGES`変数を使用している箇所）を指定する必要があるので注意。

GitHub ではデフォルトのトークンである`GITHUB_TOKEN`がパッケージの書き込み権限を持っているが、Gitea の場合はデフォルトのトークンである`GITEA_TOKEN`は書き込み権限を持っていないため、新しいトークンを作成する必要がある。

トークンを作成するには、下記画像にあるアカウントの設定画面より「アプリケーション」設定を表示し、アクセストークンの作成を行う。

{{< img src="image5.png" alt="Giteaの設定画面2" >}}

任意のトークン名を設定し、画面をさらに下にスクロールしていくと`packages`の項目が見つかるはずである。

{{< img src="image6.png" alt="Giteaの設定画面2" width="300">}}

読み取りと書き込みを選択し、「トークンの生成」をクリックするとトークンが作成される。このトークンの値は忘れずにコピーしておくこと。最後に、このトークンの値を持つシークレット変数しよう。

シークレット変数を作成するには、アカウントまたはリポジトリの設定画面の「Actions」→「シークレット」を表示する。

{{< img src="image7.png" alt="Giteaの設定画面2" >}}

シークレット管理画面が表示されるので、「シークレットを追加」ボタンをクリックする。

{{< img src="image8.png" alt="Giteaの設定画面2" >}}

ダイアログが表示されるので、任意のシークレット名（docker-compose.yaml で指定した名前）と、先ほど生成したトークンを貼り付ければ完了。コードを PUSH し、Actions が完了するのを待とう。

{{< img src="image9.png" alt="Giteaの設定画面2" >}}

上記画像のようにパッケージが作成されていれば成功です。
