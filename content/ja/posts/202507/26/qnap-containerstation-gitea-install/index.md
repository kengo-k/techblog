---
title: "Container StationにGiteaをインストールする"
date: 2025-07-26
tags: ["QNAP"]
description: "QNAPのContainer StationにGiteaをインストールし、自宅Gitサーバーを構築した時のメモです"
keywords: ["QNAP", "Gitea", "Container Station", "Git", "自宅サーバー"]
toc: false
---

前回に引き続き Container Station ネタです。今回は Container Station 上に Gitea をインストールしたので、その時の作業記録となります。Gitea は Go 製の Git サーバで非常に軽量なのが特徴らしい。これまでは GitBucket （これは Java 製）を使っていましたが、Gitea に移行するだけで使用メモリが大幅に削減されること、さらに GitHub Actions 互換のワークフロー（Gitea Actions）を実行できるとのこと。ちょうどブログをやり始めたこともあり、記録を残しつつ移行してみることにしました。

ゴールは Gitea Actions が動作すること、およびコンテナイメージを Gitea のコンテナレジストリに PUSH できるようにすること、とします。

**注意**: 本記事は自宅 QNAP 環境でのローカル運用を前提としています。そのため、簡易性を重視して HTTP 通信を使用していますが、インターネットに公開する場合は必ず HTTPS の設定を行ってください。また、データベースのパスワードは実際の運用では、より強固なパスワードを使用してください。

## 作業手順

1. Gitea をインストールする
1. Gitea Runner をインストールする
1. 動作確認

インストールは二つの docker-compose.yaml に分けて行う。先に Gitea をインストールし Gitea Runner のインストール時に指定するトークンを事前に取得しておく必要があるからである。

## Gitea のインストール

まず Gitea 本体のインストールのために、下記の docker-compose.yaml を作成する。

```yaml
version: "3.7"
services:
  gitea:
    image: gitea/gitea:1.21
    container_name: gitea_web
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
      - GITEA__packages__ENABLED=true
    volumes:
      - gitea_data:/data
    networks:
      gitea_qnet:
        ipv4_address: 192.168.1.111
      internal_network:
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    container_name: gitea_db
    environment:
      - POSTGRES_USER=gitea
      - POSTGRES_PASSWORD=gitea_password
      - POSTGRES_DB=gitea
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal_network

volumes:
  gitea_data:
  postgres_data:

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

これを入れておかないと、設定画面等に該当のメニューが表示されず、使うことができない。

次にネットワーク関連の設定については、自宅のネットワーク（192.168.1.0）内の固定 IP を振るための設定（ブリッジ接続）をしている。この設定をしない場合は、QNAP ホストの IP を使ってポートフォワード経由でコンテナにアクセスすることになる。個人的な好みとして、（めんどくさいので）なるべくポート番号を指定したくないし、どのポートが使用中であるかの管理もしたくないので、私は基本的にブリッジ接続を使用することにしている。

コンテナ起動後に Web にアクセスすると、インストール画面が表示される。インストール後にユーザー登録をすると、下記画像のような TOP ページが表示されるはずである。

{{< img src="image1.png" quality="5" alt="Giteaの設定画面" >}}

右上のユーザーアイコンをクリックし「Settings」メニューをクリックする。

{{< img src="image2.png" alt="Giteaの設定画面2" >}}

設定画面では、サイドバーにある「Actions」メニューより「Runners」をクリックし、右上の「Create new Runner」ボタンをクリックする。

{{< img src="image3.png" alt="Giteaの設定画面3" width="300">}}

トークンが表示されるので、このトークンをコピーしておくこと。

## Gitea Runner のインストール

下記の docker-compose.yaml を作成し、Gitea Runner をインストールする。

```yaml
version: "3.7"
services:
  gitea-runner:
    image: gitea/act_runner:0.2.12
    container_name: gitea_runner
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - runner_data:/data
    environment:
      - GITEA_INSTANCE_URL=http://192.168.1.111
      - GITEA_RUNNER_REGISTRATION_TOKEN=Giteaの設定画面で取得したトークン
    networks:
      gitea_runner_qnet:
        ipv4_address: 192.168.1.112
    restart: unless-stopped

volumes:
  runner_data:

networks:
  gitea_runner_qnet:
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
```

`GITEA_RUNNER_REGISTRATION_TOKEN`に先ほど Gitea の設定画面で取得したトークンを設定すること。docker.sock をマウントしているのは Actions 内で docker コマンドを使うことを想定しているため。

**注意**: トークンを含んだ docker-compose.yaml ファイルを GitHub 等にコミットしないよう注意すること。

コンテナが起動し、しばらく待つと下記のような表示になっているはずである。

{{< img src="image4.png" alt="Giteaの設定画面2" >}}

Gitea のランナー管理画面に新しいランナーが登録されていることが確認できた。うまくいかない場合はランナーコンテナのログを確認してみると、何かしらのエラーが表示されている可能性が高い。

## 動作確認

ここまでで必要な設定ができているはずなので、実際に動作確認をしてみる。Go の HelloWorld バイナリを埋め込んだ Docker イメージを Gitea のレジストリに登録できることを確認しよう。

ソースファイルは下記。

**main.go**

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

Gitea のレジストリにログインする際は、パッケージへの書き込み権限を持つトークンが必要である。デフォルトの`GITEA_TOKEN`は書き込み権限がないため、新しいトークンを作成する必要がある。

トークンを作成するには、下記画像にあるアカウントの設定画面より「Applications」設定を表示し、アクセストークンの作成を行う。

{{< img src="image5.png" alt="Giteaの設定画面2" >}}

ここでは任意のトークン名を設定し、適切な権限を設定する。「Generate Token」ボタンの上にある **Select permissions** をクリックすると権限の一覧が表示される。一覧を下にスクロール指定していくと　**package** の項目が見つかるはずである。

{{< img src="image6.png" alt="Giteaの設定画面2" width="300">}}

「Read and Write」を選択し、「Generate Token」をクリックするとトークンが作成される。このトークンの値は忘れずにコピーしておくこと。最後に、このトークンの値を持つシークレット変数を作成しよう。

シークレット変数を作成するには、アカウントまたはリポジトリの設定画面の「Actions」→「Secrets」を表示する。

{{< img src="image7.png" alt="Giteaの設定画面2" >}}

シークレット管理画面が表示されるので、「Add Secret」ボタンをクリックする。

{{< img src="image8.png" alt="Giteaの設定画面2" >}}

ダイアログが表示されるので、任意のシークレット名（docker-compose.yaml で指定した名前）と、先ほど生成したトークンを貼り付ければ完了。ひと通りコードの作成が終了したので、これまで作成したコードを PUSH しよう。まずは Gitea にテスト用のリポジトリ（ここでは test_repo とした）を作成する。さらにリポジトリの設定画面で Actions の有効化を行う。

{{< img src="image9.png" alt="Giteaの設定画面2" >}}

デフォルトでは上記の「Actions」はチェックが OFF になっているので ON にする。これで準備が完了したので、リポジトリにコードを PUSH して Actions が正しく動作するかどうかを確認しよう。

{{< img src="image10.png" alt="Giteaの設定画面2" >}}

上記画像のようにパッケージが作成されていれば成功である。
