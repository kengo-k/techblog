---
title: "Docker基本操作ガイド"
tags: ["React", "JavaScript", "Web"]
description: "Dockerの基本的な操作方法とコンテナ化の基礎について解説します。"
---

Dockerの基本的な操作方法とコンテナ化の基礎について解説します。

## Dockerの基本概念

Dockerはアプリケーションをコンテナ化するためのプラットフォームです。

### 基本的なコマンド

```bash
# イメージの検索
docker search nginx

# イメージの取得
docker pull nginx:latest

# コンテナの実行
docker run -d -p 8080:80 --name my-nginx nginx

# 実行中のコンテナ確認
docker ps

# すべてのコンテナ確認
docker ps -a

# コンテナの停止
docker stop my-nginx

# コンテナの削除
docker rm my-nginx
```

## Dockerfileの作成

```dockerfile
# Node.js アプリケーションの例
FROM node:16-alpine

# 作業ディレクトリの設定
WORKDIR /app

# パッケージファイルのコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# アプリケーションのコピー
COPY . .

# ポートの公開
EXPOSE 3000

# アプリケーションの実行
CMD ["npm", "start"]
```

## イメージのビルド

```bash
# イメージのビルド
docker build -t my-app:latest .

# タグ付きビルド
docker build -t my-app:v1.0.0 .

# コンテキストを指定してビルド
docker build -f Dockerfile.prod -t my-app:prod .
```

## docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db
    volumes:
      - ./app:/app
      - /app/node_modules

  db:
    image: postgres:13
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## Docker Composeの操作

```bash
# サービスの起動
docker-compose up -d

# ログの確認
docker-compose logs -f

# サービスの停止
docker-compose down

# ボリュームも含めて削除
docker-compose down -v

# 特定のサービスのみ再起動
docker-compose restart web
```

## 実用的な例

```bash
# データベースのバックアップ
docker exec my-postgres pg_dump -U user myapp > backup.sql

# コンテナ内でのコマンド実行
docker exec -it my-app sh

# ファイルのコピー
docker cp my-app:/app/logs ./logs

# リソース使用量の確認
docker stats

# 不要なイメージ・コンテナの削除
docker system prune -a
```

Dockerを使用することで、アプリケーションの開発・デプロイを効率化できます。